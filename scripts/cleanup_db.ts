import { db as docClient } from "../src/config/dynamodb";
import { ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const tables = [
  process.env.USERS_TABLE || "Users",
  process.env.ORDERS_TABLE || "Orders",
  process.env.MENU_TABLE || "Menu",
  process.env.NOTIFICATIONS_TABLE || "Notifications",
  process.env.OTP_TABLE || "OTPs"
];

async function clearAllTables() {
  for (const tableName of tables) {
    console.log(`Clearing table: ${tableName}...`);
    try {
      const scanResult = await docClient.send(new ScanCommand({ TableName: tableName }));
      const items = scanResult.Items || [];
      
      console.log(`Found ${items.length} items in ${tableName} to delete.`);
      
      for (const item of items) {
        // More robust key detection
        const key = item.id !== undefined ? { id: item.id } : (item.Id !== undefined ? { Id: item.Id } : null);
        
        if (!key) {
          console.warn(`Could not determine primary key for item in ${tableName}:`, item);
          continue;
        }

        await docClient.send(new DeleteCommand({
          TableName: tableName,
          Key: key
        }));
      }
      
      console.log(`${tableName} cleared successfully.`);
    } catch (error: any) {
      console.error(`Cleanup failed for ${tableName}:`, error.message);
    }
  }
}

clearAllTables();
