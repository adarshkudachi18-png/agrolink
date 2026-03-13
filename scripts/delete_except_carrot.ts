import { db as docClient } from "../src/config/dynamodb";
import { ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

// We likely don't want to delete Users or OTPs, just to preserve login functionality.
// If the user meant "literally EVERYTHING including Users except Carrot", we can add Users back.
const tables = [
  process.env.ORDERS_TABLE || "Orders",
  process.env.MENU_TABLE || "Menu",
  process.env.NOTIFICATIONS_TABLE || "Notifications",
];

async function clearTablesExceptCarrot() {
  for (const tableName of tables) {
    console.log(`Scanning table: ${tableName}...`);
    try {
      const scanResult = await docClient.send(new ScanCommand({ TableName: tableName }));
      const items = scanResult.Items || [];
      
      console.log(`Found ${items.length} items in ${tableName}.`);
      
      let deletedCount = 0;
      for (const item of items) {
        const name = (item.Name || item.crop || item.ItemName || item.CropName || "").toLowerCase();
        
        // Skip anything matching 'carrot'
        if (name.includes('carrot')) {
          console.log(`Skipping carrot item: ${item.Id || item.id}`);
          continue;
        }

        // Determine key
        const keyName = item.id ? 'id' : (item.Id ? 'Id' : Object.keys(item)[0]);
        if (!keyName || item[keyName] === undefined) continue;

        try {
          await docClient.send(new DeleteCommand({
            TableName: tableName,
            Key: { [keyName]: item[keyName] }
          }));
          deletedCount++;
        } catch (e: any) {
          console.error(`Failed to delete ${item[keyName]} in ${tableName}: ${e.message}`);
        }
      }
      
      console.log(`Deleted ${deletedCount} non-carrot items from ${tableName}.`);
    } catch (error: any) {
      console.error(`Cleanup failed for ${tableName}:`, error.message);
    }
  }
}

clearTablesExceptCarrot();
