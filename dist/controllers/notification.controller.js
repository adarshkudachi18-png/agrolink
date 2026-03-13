"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamodb_1 = require("../config/dynamodb");
const getNotifications = async (req, res) => {
    try {
        const tableName = process.env.NOTIFICATIONS_TABLE || "Notifications";
        const command = new lib_dynamodb_1.ScanCommand({
            TableName: tableName,
        });
        const result = await dynamodb_1.db.send(command);
        res.status(200).json({
            success: true,
            data: result.Items || [],
        });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications from database",
        });
    }
};
exports.getNotifications = getNotifications;
