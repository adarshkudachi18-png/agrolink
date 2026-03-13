import { db } from "./src/config/dynamodb.js";
import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

async function testDb() {
  try {
    console.log("Testing DynamoDB connection...");
    const USERS_TABLE = process.env.USERS_TABLE || "Users";
    console.log("Table:", USERS_TABLE);
    
    // Just a scan with limit 1 to see if table is accessible
    const scanResult = await db.send(new ScanCommand({
      TableName: USERS_TABLE,
      Limit: 1
    }));
    console.log("Success! Found items:", scanResult.Items?.length);
  } catch (error) {
    console.error("DynamoDB test failed:");
    console.error(error);
  }
}

testDb();
