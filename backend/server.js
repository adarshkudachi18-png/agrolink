const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const path = require("path");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");

dotenv.config({ path: path.join(__dirname, ".env") });

// --- Basic app setup ---
const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend (built files or plain HTML) from /public at project root
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// --- AWS DynamoDB setup ---
AWS.config.update({
  region: process.env.AWS_REGION || "eu-north-1",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const ddb = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE = process.env.USERS_TABLE || "Users";
const CROPS_TABLE = process.env.CROPS_TABLE || "Crops";
const ORDERS_TABLE = process.env.ORDERS_TABLE || "Orders";
const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE || "Transactions";
const WITHDRAWALS_TABLE = process.env.WITHDRAWALS_TABLE || "WithdrawRequests";

// --- Razorpay setup ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Small helper to safely parse numbers
const toNumber = (value, fallback = 0) => {
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
};

// Ensure a user exists and return its record (creates with wallet_balance 0 if not found)
async function ensureUser(userId) {
  if (!userId) {
    throw new Error("user_id is required");
  }

  const getParams = {
    TableName: USERS_TABLE,
    Key: { user_id: userId },
  };

  const existing = await ddb.get(getParams).promise();
  if (existing.Item) return existing.Item;

  const newUser = {
    user_id: userId,
    name: userId,
    role: "user",
    wallet_balance: 0,
  };

  await ddb
    .put({
      TableName: USERS_TABLE,
      Item: newUser,
    })
    .promise();

  return newUser;
}

// Record a wallet transaction
async function recordTransaction(userId, type, amount, extra = {}) {
  const transaction = {
    transaction_id: uuidv4(),
    user_id: userId,
    type,
    amount: toNumber(amount),
    timestamp: new Date().toISOString(),
    ...extra,
  };

  await ddb
    .put({
      TableName: TRANSACTIONS_TABLE,
      Item: transaction,
    })
    .promise();

  return transaction;
}

// --- 1️⃣ WALLET PAYMENT API (RAZORPAY) ---

// Create Razorpay order for wallet top-up
app.post("/create-wallet-order", async (req, res) => {
  try {
    const { amount } = req.body;
    const numericAmount = toNumber(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const options = {
      amount: Math.round(numericAmount * 100), // paise
      currency: "INR",
      receipt: `wallet_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("Error creating wallet order:", err);
    return res.status(500).json({ message: "Failed to create wallet order" });
  }
});

// Verify Razorpay signature and credit wallet
app.post("/verify-wallet-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
      amount,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing Razorpay payment fields" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ status: "failure", message: "Invalid payment signature" });
    }

    const numericAmount = toNumber(amount);
    if (!user_id || !numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "user_id and valid amount are required" });
    }

    await ensureUser(user_id);

    // Increase wallet balance
    await ddb
      .update({
        TableName: USERS_TABLE,
        Key: { user_id },
        UpdateExpression: "SET wallet_balance = if_not_exists(wallet_balance, :zero) + :amt",
        ExpressionAttributeValues: {
          ":zero": 0,
          ":amt": numericAmount,
        },
        ReturnValues: "UPDATED_NEW",
      })
      .promise();

    await recordTransaction(user_id, "credit", numericAmount, {
      source: "wallet_topup",
      razorpay_order_id,
      razorpay_payment_id,
    });

    return res.status(200).json({
      status: "success",
      message: "Wallet topped up successfully",
    });
  } catch (err) {
    console.error("Error verifying wallet payment:", err);
    return res.status(500).json({ message: "Failed to verify wallet payment" });
  }
});

// --- 2️⃣ CROP LISTING API ---

// Add crop listing
app.post("/add-crop", async (req, res) => {
  try {
    const { farmer_id, crop_name, price_per_kg, quantity, lat, lng } = req.body;

    if (!farmer_id || !crop_name) {
      return res.status(400).json({ message: "farmer_id and crop_name are required" });
    }

    const crop = {
      crop_id: uuidv4(),
      farmer_id,
      crop_name,
      price_per_kg: toNumber(price_per_kg),
      quantity: toNumber(quantity),
      lat: toNumber(lat),
      lng: toNumber(lng),
      created_at: new Date().toISOString(),
    };

    await ddb
      .put({
        TableName: CROPS_TABLE,
        Item: crop,
      })
      .promise();

    return res.status(201).json(crop);
  } catch (err) {
    console.error("Error adding crop:", err);
    return res.status(500).json({ message: "Failed to add crop" });
  }
});

// Get all crops with coordinates for map
app.get("/nearby-crops", async (req, res) => {
  try {
    const result = await ddb
      .scan({
        TableName: CROPS_TABLE,
      })
      .promise();

    const items = result.Items || [];

    const response = items.map((item) => ({
      farmer_id: item.farmer_id,
      farmer_name: item.farmer_name || item.farmer_id || "Farmer",
      crop_id: item.crop_id,
      crop_name: item.crop_name,
      price_per_kg: item.price_per_kg,
      quantity: item.quantity,
      lat: item.lat,
      lng: item.lng,
    }));

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error fetching nearby crops:", err);
    return res.status(500).json({ message: "Failed to fetch crops" });
  }
});

// --- 3️⃣ ORDER SYSTEM API ---

// Create order and hold money in escrow by debiting retailer wallet
app.post("/create-order", async (req, res) => {
  try {
    const {
      order_id,
      farmer_id,
      retailer_id,
      crop_id,
      quantity,
      total_price,
      status,
    } = req.body;

    if (!farmer_id || !retailer_id || !crop_id) {
      return res.status(400).json({ message: "farmer_id, retailer_id and crop_id are required" });
    }

    const price = toNumber(total_price);
    if (!price || price <= 0) {
      return res.status(400).json({ message: "total_price must be > 0" });
    }

    // Make sure retailer exists and has enough balance
    const retailer = await ensureUser(retailer_id);
    const currentBalance = toNumber(retailer.wallet_balance);
    if (currentBalance < price) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // Debit retailer wallet (escrow)
    await ddb
      .update({
        TableName: USERS_TABLE,
        Key: { user_id: retailer_id },
        UpdateExpression: "SET wallet_balance = wallet_balance - :amount",
        ConditionExpression: "wallet_balance >= :amount",
        ExpressionAttributeValues: {
          ":amount": price,
        },
        ReturnValues: "UPDATED_NEW",
      })
      .promise();

    await recordTransaction(retailer_id, "debit", price, {
      reason: "order_escrow",
    });

    const id = order_id || uuidv4();
    const orderItem = {
      order_id: id,
      farmer_id,
      retailer_id,
      crop_id,
      quantity: toNumber(quantity),
      total_price: price,
      status: status || "pending",
      created_at: new Date().toISOString(),
    };

    await ddb
      .put({
        TableName: ORDERS_TABLE,
        Item: orderItem,
      })
      .promise();

    return res.status(201).json(orderItem);
  } catch (err) {
    console.error("Error creating order:", err);
    if (err.code === "ConditionalCheckFailedException") {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }
    return res.status(500).json({ message: "Failed to create order" });
  }
});

// Cancel order and refund retailer wallet
app.post("/cancel-order", async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }

    const orderResult = await ddb
      .get({
        TableName: ORDERS_TABLE,
        Key: { order_id },
      })
      .promise();

    const order = orderResult.Item;
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Only pending orders can be cancelled" });
    }

    const amount = toNumber(order.total_price);

    // Update order status
    await ddb
      .update({
        TableName: ORDERS_TABLE,
        Key: { order_id },
        UpdateExpression: "SET #s = :cancelled",
        ExpressionAttributeNames: {
          "#s": "status",
        },
        ExpressionAttributeValues: {
          ":cancelled": "cancelled",
        },
      })
      .promise();

    // Refund to retailer
    const retailer_id = order.retailer_id;
    await ensureUser(retailer_id);

    await ddb
      .update({
        TableName: USERS_TABLE,
        Key: { user_id: retailer_id },
        UpdateExpression: "SET wallet_balance = if_not_exists(wallet_balance, :zero) + :amount",
        ExpressionAttributeValues: {
          ":zero": 0,
          ":amount": amount,
        },
      })
      .promise();

    await recordTransaction(retailer_id, "refund", amount, {
      reason: "order_cancelled",
      order_id,
    });

    return res.status(200).json({ message: "Order cancelled and amount refunded" });
  } catch (err) {
    console.error("Error cancelling order:", err);
    return res.status(500).json({ message: "Failed to cancel order" });
  }
});

// Confirm delivery: release escrow to farmer and platform
app.post("/confirm-delivery", async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }

    const orderResult = await ddb
      .get({
        TableName: ORDERS_TABLE,
        Key: { order_id },
      })
      .promise();

    const order = orderResult.Item;
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Only pending orders can be confirmed" });
    }

    const total = toNumber(order.total_price);
    const platformFee = Math.round(total * 0.02);
    const farmerAmount = total - platformFee;

    // Mark order as completed
    await ddb
      .update({
        TableName: ORDERS_TABLE,
        Key: { order_id },
        UpdateExpression: "SET #s = :completed",
        ExpressionAttributeNames: {
          "#s": "status",
        },
        ExpressionAttributeValues: {
          ":completed": "completed",
        },
      })
      .promise();

    const farmer_id = order.farmer_id;
    await ensureUser(farmer_id);

    // Credit farmer wallet
    await ddb
      .update({
        TableName: USERS_TABLE,
        Key: { user_id: farmer_id },
        UpdateExpression: "SET wallet_balance = if_not_exists(wallet_balance, :zero) + :amount",
        ExpressionAttributeValues: {
          ":zero": 0,
          ":amount": farmerAmount,
        },
      })
      .promise();

    await recordTransaction(farmer_id, "credit", farmerAmount, {
      reason: "order_payout",
      order_id,
    });

    // Credit platform wallet (special user "platform")
    const platformId = "platform";
    await ensureUser(platformId);

    await ddb
      .update({
        TableName: USERS_TABLE,
        Key: { user_id: platformId },
        UpdateExpression: "SET wallet_balance = if_not_exists(wallet_balance, :zero) + :fee",
        ExpressionAttributeValues: {
          ":zero": 0,
          ":fee": platformFee,
        },
      })
      .promise();

    await recordTransaction(platformId, "credit", platformFee, {
      reason: "platform_fee",
      order_id,
    });

    return res.status(200).json({
      message: "Delivery confirmed and funds released",
      farmer_amount: farmerAmount,
      platform_fee: platformFee,
    });
  } catch (err) {
    console.error("Error confirming delivery:", err);
    return res.status(500).json({ message: "Failed to confirm delivery" });
  }
});

// --- Demo wallet top-up (no Razorpay); also under /api for frontend ---
app.post("/api/payments/wallet/demo-topup", async (req, res) => {
  try {
    const userId = req.body?.userId ?? req.body?.user_id;
    const amount = req.body?.amount;
    const num = typeof amount === "number" ? amount : parseFloat(amount);
    if (!userId || !Number.isFinite(num) || num <= 0) {
      return res.status(400).json({ message: "userId and valid amount required" });
    }
    const uid = String(userId).trim();
    await ensureUser(uid);
    await ddb
      .update({
        TableName: USERS_TABLE,
        Key: { user_id: uid },
        UpdateExpression: "SET wallet_balance = if_not_exists(wallet_balance, :z) + :a",
        ExpressionAttributeValues: { ":z": 0, ":a": num },
        ReturnValues: "UPDATED_NEW",
      })
      .promise();
    await recordTransaction(uid, "credit", num, { source: "demo_topup" });
    return res.status(200).json({ status: "success", message: "Wallet topped up" });
  } catch (err) {
    console.error("Demo wallet topup error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Wallet balance under /api for frontend (same path as TypeScript backend)
app.get("/api/payments/wallet/balance/:userId", async (req, res) => {
  try {
    const userId = req.params.userId || req.params.user_id;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const user = await ensureUser(String(userId).trim());
    return res.status(200).json({
      userId: user.user_id,
      balance: toNumber(user.wallet_balance),
    });
  } catch (err) {
    console.error("Get wallet balance error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// --- 4️⃣ WALLET APIs ---

// Get wallet balance
app.get("/wallet/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const user = await ensureUser(user_id);
    return res.status(200).json({
      user_id: user.user_id,
      wallet_balance: toNumber(user.wallet_balance),
    });
  } catch (err) {
    console.error("Error getting wallet:", err);
    return res.status(500).json({ message: "Failed to get wallet" });
  }
});

// Get transaction history (simple scan filtered by user_id)
app.get("/transactions/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const result = await ddb
      .scan({
        TableName: TRANSACTIONS_TABLE,
        FilterExpression: "user_id = :uid",
        ExpressionAttributeValues: {
          ":uid": user_id,
        },
      })
      .promise();

    const items = (result.Items || []).sort((a, b) =>
      String(b.timestamp || "").localeCompare(String(a.timestamp || ""))
    );

    return res.status(200).json(items);
  } catch (err) {
    console.error("Error getting transactions:", err);
    return res.status(500).json({ message: "Failed to get transactions" });
  }
});

// Request withdrawal
app.post("/request-withdrawal", async (req, res) => {
  try {
    const { user_id, account_number, ifsc, amount } = req.body;

    if (!user_id || !account_number || !ifsc) {
      return res
        .status(400)
        .json({ message: "user_id, account_number and ifsc are required" });
    }

    const numericAmount = toNumber(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const user = await ensureUser(user_id);
    const currentBalance = toNumber(user.wallet_balance);
    if (currentBalance < numericAmount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // Deduct from wallet
    await ddb
      .update({
        TableName: USERS_TABLE,
        Key: { user_id },
        UpdateExpression: "SET wallet_balance = wallet_balance - :amount",
        ConditionExpression: "wallet_balance >= :amount",
        ExpressionAttributeValues: {
          ":amount": numericAmount,
        },
      })
      .promise();

    await recordTransaction(user_id, "withdrawal", numericAmount, {
      status: "pending",
    });

    // Create withdrawal request
    const withdraw_id = uuidv4();
    const withdrawItem = {
      withdraw_id,
      user_id,
      account_number,
      ifsc,
      amount: numericAmount,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    await ddb
      .put({
        TableName: WITHDRAWALS_TABLE,
        Item: withdrawItem,
      })
      .promise();

    return res.status(201).json(withdrawItem);
  } catch (err) {
    console.error("Error requesting withdrawal:", err);
    if (err.code === "ConditionalCheckFailedException") {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }
    return res.status(500).json({ message: "Failed to request withdrawal" });
  }
});

// --- Health check for debugging ---
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "FarmBridge Backend" });
});

app.listen(PORT, () => {
  console.log(`FarmBridge server running on port ${PORT}`);
});

