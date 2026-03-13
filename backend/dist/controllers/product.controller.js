"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProducts = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamodb_1 = require("../config/dynamodb");
const uuid_1 = require("uuid");
const getProducts = async (req, res) => {
    try {
        const tableName = process.env.MENU_TABLE || "Menu";
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
        console.error("Error fetching products:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch products from database",
        });
    }
};
exports.getProducts = getProducts;
const createProduct = async (req, res) => {
    try {
        const tableName = process.env.MENU_TABLE || "Menu";
        const product = req.body;
        const id = (0, uuid_1.v4)();
        const item = {
            id: id,
            ...product,
            CreatedAt: new Date().toISOString(),
        };
        const command = new lib_dynamodb_1.PutCommand({
            TableName: tableName,
            Item: item,
        });
        await dynamodb_1.db.send(command);
        res.status(201).json({
            success: true,
            data: item,
        });
    }
    catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create product in database",
        });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
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
        const updateParts = [];
        const exprNames = {};
        const exprValues = {};
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
        const command = new lib_dynamodb_1.UpdateCommand({
            TableName: tableName,
            Key: { id },
            UpdateExpression: "SET " + updateParts.join(", "),
            ExpressionAttributeNames: Object.keys(exprNames).length ? exprNames : undefined,
            ExpressionAttributeValues: exprValues,
            ReturnValues: "ALL_NEW",
        });
        const result = await dynamodb_1.db.send(command);
        res.status(200).json({
            success: true,
            data: result.Attributes,
        });
    }
    catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update product in database",
        });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const tableName = process.env.MENU_TABLE || "Menu";
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Product id is required",
            });
        }
        const command = new lib_dynamodb_1.DeleteCommand({
            TableName: tableName,
            Key: { id },
        });
        await dynamodb_1.db.send(command);
        res.status(200).json({
            success: true,
            message: "Product deleted",
        });
    }
    catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete product from database",
        });
    }
};
exports.deleteProduct = deleteProduct;
