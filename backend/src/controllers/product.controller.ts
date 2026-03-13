import { Request, Response } from "express";
import { ScanCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../config/dynamodb";
import { v4 as uuidv4 } from "uuid";

export const getProducts = async (req: Request, res: Response) => {
  try {
    const tableName = process.env.MENU_TABLE || "Menu";
    
    const command = new ScanCommand({
      TableName: tableName,
    });

    const result = await db.send(command);

    res.status(200).json({
      success: true,
      data: result.Items || [],
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products from database",
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const tableName = process.env.MENU_TABLE || "Menu";
    const product = req.body;
    
    const id = uuidv4();
    const item = {
      id: id,
      ...product,
      CreatedAt: new Date().toISOString(),
    };

    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });

    await db.send(command);

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product in database",
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const tableName = process.env.MENU_TABLE || "Menu";
    const { id } = req.params;
    const { Name, Quantity, Unit, Price, DeliveryDate, Location } = req.body || {};

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product id is required",
      });
    }

    const updateParts: string[] = [];
    const exprNames: Record<string, string> = {};
    const exprValues: Record<string, any> = {};

    if (Name !== undefined) {
      updateParts.push("#n = :name");
      exprNames["#n"] = "Name";
      exprValues[":name"] = Name;
    }
    if (Quantity !== undefined) {
      updateParts.push("Quantity = :qty");
      exprValues[":qty"] = Quantity;
    }
    if (Unit !== undefined) {
      updateParts.push("Unit = :unit");
      exprValues[":unit"] = Unit;
    }
    if (Price !== undefined) {
      updateParts.push("Price = :price");
      exprValues[":price"] = Price;
    }
    if (DeliveryDate !== undefined) {
      updateParts.push("DeliveryDate = :dd");
      exprValues[":dd"] = DeliveryDate;
    }
    if (Location !== undefined) {
      updateParts.push("Location = :loc");
      exprValues[":loc"] = Location;
    }

    if (updateParts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided to update",
      });
    }

    const command = new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: "SET " + updateParts.join(", "),
      ExpressionAttributeNames: Object.keys(exprNames).length ? exprNames : undefined,
      ExpressionAttributeValues: exprValues,
      ReturnValues: "ALL_NEW",
    });

    const result = await db.send(command);

    res.status(200).json({
      success: true,
      data: result.Attributes,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product in database",
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const tableName = process.env.MENU_TABLE || "Menu";
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product id is required",
      });
    }

    const command = new DeleteCommand({
      TableName: tableName,
      Key: { id },
    });

    await db.send(command);

    res.status(200).json({
      success: true,
      message: "Product deleted",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product from database",
    });
  }
};
