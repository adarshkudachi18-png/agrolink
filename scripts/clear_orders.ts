import { db as docClient } from "../src/config/dynamodb";
import { ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

async function clearOrdersTable() {
  const tableName = process.env.ORDERS_TABLE || "Orders";
  console.log(`Clearing table: ${tableName}...`);
  try {
    const scanResult = await docClient.send(new ScanCommand({ TableName: tableName }));
    const items = scanResult.Items || [];
    
    console.log(`Found ${items.length} orders in ${tableName} to delete.`);
    
    let deletedCount = 0;
    for (const item of items) {
      // Determine the primary key name (usually 'id' or 'Id')
      const keyName = item.id ? 'id' : (item.Id ? 'Id' : Object.keys(item)[0]);
      
      if (!keyName || item[keyName] === undefined) {
        console.warn('Could not determine key for item:', item);
        continue;
      }

      await docClient.send(new DeleteCommand({
        TableName: tableName,
        Key: { [keyName]: item[keyName] }
      }));
      deletedCount++;
    }
    
    console.log(`Successfully deleted ${deletedCount} items from ${tableName}.`);
  } catch (error: any) {
    console.error(`Cleanup failed for ${tableName}:`, error.message);
  }
}

clearOrdersTable();
