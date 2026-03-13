import { Request, Response } from "express";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../config/dynamodb";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const tableName = process.env.NOTIFICATIONS_TABLE || "Notifications";
    
    const command = new ScanCommand({
      TableName: tableName,
    });

    const result = await db.send(command);

    res.status(200).json({
      success: true,
      data: result.Items || [],
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications from database",
    });
  }
};
