import { Request, Response } from "express";
import { ScanCommand, PutCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../config/dynamodb";
import { v4 as uuidv4 } from "uuid";
import { sendNotificationEmail } from "../services/notification.service";

export const getOrders = async (req: Request, res: Response) => {
  try {
    const tableName = process.env.ORDERS_TABLE || "Orders";
    
    const command = new ScanCommand({
      TableName: tableName,
    });

    const result = await db.send(command);

    res.status(200).json({
      success: true,
      data: result.Items || [],
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders from database",
    });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const ordersTable = process.env.ORDERS_TABLE || "Orders";
    const notificationsTable = process.env.NOTIFICATIONS_TABLE || "Notifications";
    const usersTable = process.env.USERS_TABLE || "Users";
    const orderData = req.body;
    
    const orderId = uuidv4();
    // Wallet rule (Option A): only allow order if wallet >= total, then deduct immediately.
    const buyerId = orderData.BuyerId;
    const amountNumber = parseFloat(orderData.Amount);

    if (!buyerId || !Number.isFinite(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: "BuyerId and valid Amount are required",
      });
    }

    const buyerResult = await db.send(
      new GetCommand({
        TableName: usersTable,
        Key: { id: buyerId },
      })
    );
    const buyer = buyerResult.Item || {};
    const walletAttr: "WalletBalance" | "wallet_balance" =
      Object.prototype.hasOwnProperty.call(buyer, "WalletBalance")
        ? "WalletBalance"
        : Object.prototype.hasOwnProperty.call(buyer, "wallet_balance")
          ? "wallet_balance"
          : "WalletBalance";

    const currentBalanceRaw = (buyer as any)[walletAttr];
    const currentBalance = typeof currentBalanceRaw === "number" ? currentBalanceRaw : 0;
    if (currentBalance < amountNumber) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    try {
      await db.send(
        new UpdateCommand({
          TableName: usersTable,
          Key: { id: buyerId },
          UpdateExpression: "SET #wb = #wb - :amt",
          ConditionExpression: "attribute_exists(#wb) AND #wb >= :amt",
          ExpressionAttributeNames: { "#wb": walletAttr },
          ExpressionAttributeValues: {
            ":amt": amountNumber,
          },
        })
      );
    } catch (e: any) {
      if (e?.name === "ConditionalCheckFailedException") {
        return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
      }
      throw e;
    }

    const orderItem = {
      id: orderId,
      ...orderData,
      Status: "pending",
      CreatedAt: new Date().toISOString(),
    };

    // Save Order
    await db.send(new PutCommand({
      TableName: ordersTable,
      Item: orderItem,
    }));

    // Create Notification
    const notificationId = uuidv4();
    const notificationItem = {
      id: notificationId,
      Type: "order",
      Title: "New Order Received",
      Message: `${orderData.BuyerName || "Someone"} ordered ${orderData.Quantity}${orderData.Unit || 'kg'} ${orderData.CropName} for ₹${orderData.Amount}`,
      Time: new Date().toISOString(),
      Read: false,
      CreatedAt: new Date().toISOString(),
    };

    await db.send(new PutCommand({
      TableName: notificationsTable,
      Item: notificationItem,
    }));

    // Send Email via Brevo
    const emailSubject = `New Order Received: ${orderData.CropName}`;
    const emailContent = `
      <h1>New Order Notification</h1>
      <p>Hello, you have received a new order for your product.</p>
      <p><strong>Crop:</strong> ${orderData.CropName}</p>
      <p><strong>Quantity:</strong> ${orderData.Quantity} ${orderData.Unit || 'kg'}</p>
      <p><strong>Amount:</strong> ₹${orderData.Amount}</p>
      <p><strong>Buyer:</strong> ${orderData.BuyerName || 'Local Retailer'}</p>
      <p>Log in to your dashboard to view more details.</p>
    `;
    
    // In a real app, you'd fetch the farmer's email. Using default for now.
    const farmerEmail = process.env.EMAIL_USER || "farmer@example.com";
    await sendNotificationEmail(farmerEmail, emailSubject, emailContent);

    res.status(201).json({
      success: true,
      data: orderItem,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order and notify",
    });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const ordersTable = process.env.ORDERS_TABLE || "Orders";
    const productsTable = process.env.MENU_TABLE || "Menu";
    const usersTable = process.env.USERS_TABLE || "Users";
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ success: false, message: "id and status are required" });
    }

    // Fetch current order to know buyer and amount
    const currentOrderResult = await db.send(new GetCommand({
      TableName: ordersTable,
      Key: { id },
    }));

    const currentOrder = currentOrderResult.Item;

    const command = new UpdateCommand({
      TableName: ordersTable,
      Key: { id },
      UpdateExpression: "SET #s = :status",
      ExpressionAttributeNames: { "#s": "Status" },
      ExpressionAttributeValues: { ":status": status },
      ReturnValues: "ALL_NEW",
    });

    const result = await db.send(command);

    // If order is marked completed or delivered, mark related product as sold
    if ((status === "completed" || status === "delivered") && currentOrder?.ProductId) {
      const productId = currentOrder.ProductId;
      try {
        await db.send(
          new UpdateCommand({
            TableName: productsTable,
            Key: { id: productId },
            UpdateExpression: "SET IsSold = :true",
            ExpressionAttributeValues: { ":true": true },
          })
        );
      } catch (e) {
        console.error("Failed to mark product as sold for order", id, "product", productId, e);
      }
    }

    // If order is cancelled, refund buyer wallet
    if (status === "cancelled" && currentOrder) {
      const buyerId = currentOrder.BuyerId;
      const amountNumber = parseFloat(currentOrder.Amount);

      if (buyerId && Number.isFinite(amountNumber) && amountNumber > 0) {
        const buyerResult = await db.send(
          new GetCommand({
            TableName: usersTable,
            Key: { id: buyerId },
          })
        );
        const buyer = buyerResult.Item || {};
        const walletAttr: "WalletBalance" | "wallet_balance" =
          Object.prototype.hasOwnProperty.call(buyer, "WalletBalance")
            ? "WalletBalance"
            : Object.prototype.hasOwnProperty.call(buyer, "wallet_balance")
              ? "wallet_balance"
              : "WalletBalance";

        await db.send(
          new UpdateCommand({
            TableName: usersTable,
            Key: { id: buyerId },
            UpdateExpression: "SET #wb = if_not_exists(#wb, :zero) + :amt",
            ExpressionAttributeNames: { "#wb": walletAttr },
            ExpressionAttributeValues: {
              ":zero": 0,
              ":amt": amountNumber,
            },
          })
        );
      }
    }

    res.status(200).json({
      success: true,
      data: result.Attributes,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};

/** Orders available for transport: farmer accepted, no transporter assigned */
export const getOrdersForTransport = async (req: Request, res: Response) => {
  try {
    const tableName = process.env.ORDERS_TABLE || "Orders";
    const result = await db.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "#s = :accepted AND (attribute_not_exists(TransporterId) OR TransporterId = :empty)",
        ExpressionAttributeNames: { "#s": "Status" },
        ExpressionAttributeValues: { ":accepted": "completed", ":empty": "" },
      })
    );
    res.status(200).json({ success: true, data: result.Items || [] });
  } catch (error) {
    console.error("Error fetching orders for transport:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders for transport" });
  }
};

/** Transporter accepts a delivery job */
export const assignTransporter = async (req: Request, res: Response) => {
  try {
    const ordersTable = process.env.ORDERS_TABLE || "Orders";
    const { id } = req.params;
    const { transporterId, transporterName } = req.body;
    if (!id || !transporterId || !transporterName) {
      return res.status(400).json({ success: false, message: "id, transporterId, and transporterName are required" });
    }
    await db.send(
      new UpdateCommand({
        TableName: ordersTable,
        Key: { id },
        UpdateExpression: "SET TransporterId = :tid, TransporterName = :tname, DeliveryStatus = :ds",
        ConditionExpression: "attribute_not_exists(TransporterId) OR TransporterId = :empty",
        ExpressionAttributeValues: {
          ":tid": transporterId,
          ":tname": transporterName,
          ":ds": "assigned",
          ":empty": "",
        },
      })
    );
    const updated = await db.send(new GetCommand({ TableName: ordersTable, Key: { id } }));
    res.status(200).json({ success: true, data: updated.Item });
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return res.status(409).json({ success: false, message: "Order already assigned to another transporter" });
    }
    console.error("Error assigning transporter:", error);
    res.status(500).json({ success: false, message: "Failed to assign transporter" });
  }
};

/** Update delivery status (picked_up, in_transit, delivered) */
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const ordersTable = process.env.ORDERS_TABLE || "Orders";
    const { id } = req.params;
    const { deliveryStatus } = req.body;
    const allowed = ["picked_up", "in_transit", "delivered"];
    if (!id || !deliveryStatus || !allowed.includes(deliveryStatus)) {
      return res.status(400).json({ success: false, message: "id and deliveryStatus (picked_up|in_transit|delivered) required" });
    }
    const updateExpr =
      deliveryStatus === "delivered"
        ? "SET DeliveryStatus = :ds, #s = :status"
        : "SET DeliveryStatus = :ds";
    const exprNames: Record<string, string> | undefined =
      deliveryStatus === "delivered" ? { "#s": "Status" } : undefined;
    const exprValues: Record<string, any> = { ":ds": deliveryStatus };
    if (deliveryStatus === "delivered") exprValues[":status"] = "delivered";
    await db.send(
      new UpdateCommand({
        TableName: ordersTable,
        Key: { id },
        UpdateExpression: updateExpr,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: exprValues,
      })
    );
    const updated = await db.send(new GetCommand({ TableName: ordersTable, Key: { id } }));
    res.status(200).json({ success: true, data: updated.Item });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    res.status(500).json({ success: false, message: "Failed to update delivery status" });
  }
};
