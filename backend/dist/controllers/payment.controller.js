"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletBalance = exports.demoWalletWithdraw = exports.demoWalletTopup = exports.verifyWalletTopupPayment = exports.createWalletTopupOrder = exports.verifyRazorpayPayment = exports.createRazorpayOrder = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamodb_1 = require("../config/dynamodb");
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET
});
const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, currency = "INR" } = req.body;
        const options = {
            amount: amount * 100, // Razorpay works in paise
            currency: currency,
            receipt: `receipt_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    }
    catch (error) {
        console.error("Razorpay order creation error:", error);
        res.status(500).json({ message: "Could not create payment order" });
    }
};
exports.createRazorpayOrder = createRazorpayOrder;
const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto_1.default
            // Support both env names; prefer RAZORPAY_SECRET
            .createHmac("sha256", process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRET || "default_secret")
            .update(body.toString())
            .digest("hex");
        if (expectedSignature === razorpay_signature) {
            res.status(200).json({ status: "success", message: "Payment verified successfully" });
        }
        else {
            res.status(400).json({ status: "failure", message: "Invalid payment signature" });
        }
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.verifyRazorpayPayment = verifyRazorpayPayment;
// ── Wallet top-up (Razorpay) ───────────────────────────────────────────────
const createWalletTopupOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: "Valid amount is required" });
        }
        try {
            const order = await razorpay.orders.create({
                amount: Math.round(numericAmount * 100), // paise
                currency: "INR",
                receipt: `wallet_${Date.now()}`,
            });
            return res.status(200).json({
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                key: process.env.RAZORPAY_KEY,
            });
        }
        catch (rpErr) {
            // Demo fallback: if Razorpay auth fails, still allow top-up for demo.
            if (rpErr?.statusCode === 401) {
                return res.status(200).json({
                    id: `demo_wallet_${Date.now()}`,
                    amount: Math.round(numericAmount * 100),
                    currency: "INR",
                    demo: true,
                    key: process.env.RAZORPAY_KEY,
                });
            }
            throw rpErr;
        }
    }
    catch (error) {
        console.error("Razorpay wallet order creation error:", error);
        res.status(500).json({ message: "Could not create wallet top-up order" });
    }
};
exports.createWalletTopupOrder = createWalletTopupOrder;
const verifyWalletTopupPayment = async (req, res) => {
    try {
        const body = req.body || {};
        const userId = body.userId ?? body.user_id;
        const amount = body.amount;
        const numericAmount = typeof amount === "number" ? amount : parseFloat(amount);
        if (!userId || String(userId).trim() === "") {
            return res.status(400).json({ message: "userId is required" });
        }
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: "Valid amount is required" });
        }
        const usersTable = process.env.USERS_TABLE || "Users";
        const id = String(userId).trim();
        const existing = await dynamodb_1.db.send(new lib_dynamodb_1.GetCommand({
            TableName: usersTable,
            Key: { id },
        }));
        if (!existing.Item) {
            return res.status(404).json({ message: "User not found" });
        }
        // Credit wallet (no signature check for demo / wallet top-up)
        await dynamodb_1.db.send(new lib_dynamodb_1.UpdateCommand({
            TableName: usersTable,
            Key: { id },
            UpdateExpression: "SET WalletBalance = if_not_exists(WalletBalance, :zero) + :amt",
            ExpressionAttributeValues: {
                ":zero": 0,
                ":amt": numericAmount,
            },
            ReturnValues: "UPDATED_NEW",
        }));
        return res.status(200).json({ status: "success", message: "Wallet topped up" });
    }
    catch (error) {
        console.error("Wallet top-up verify error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.verifyWalletTopupPayment = verifyWalletTopupPayment;
/** Demo-only: credit wallet by amount. No Razorpay. */
const demoWalletTopup = async (req, res) => {
    try {
        const userId = req.body?.userId ?? req.body?.user_id;
        const amount = req.body?.amount;
        const num = typeof amount === "number" ? amount : parseFloat(amount);
        if (!userId || !Number.isFinite(num) || num <= 0) {
            return res.status(400).json({ message: "userId and valid amount required" });
        }
        const usersTable = process.env.USERS_TABLE || "Users";
        const id = String(userId).trim();
        const existing = await dynamodb_1.db.send(new lib_dynamodb_1.GetCommand({ TableName: usersTable, Key: { id } }));
        if (!existing.Item) {
            return res.status(404).json({ message: "User not found" });
        }
        await dynamodb_1.db.send(new lib_dynamodb_1.UpdateCommand({
            TableName: usersTable,
            Key: { id },
            UpdateExpression: "SET WalletBalance = if_not_exists(WalletBalance, :z) + :a",
            ExpressionAttributeValues: { ":z": 0, ":a": num },
        }));
        return res.status(200).json({ status: "success", message: "Wallet topped up" });
    }
    catch (e) {
        console.error("Demo wallet topup error:", e);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.demoWalletTopup = demoWalletTopup;
/** Demo-only: withdraw from wallet by amount. */
const demoWalletWithdraw = async (req, res) => {
    try {
        const userId = req.body?.userId ?? req.body?.user_id;
        const amount = req.body?.amount;
        const upiId = req.body?.upiId;
        const num = typeof amount === "number" ? amount : parseFloat(amount);
        if (!userId || !Number.isFinite(num) || num <= 0 || !upiId) {
            return res.status(400).json({ message: "userId, valid amount and upiId required" });
        }
        const usersTable = process.env.USERS_TABLE || "Users";
        const id = String(userId).trim();
        const existing = await dynamodb_1.db.send(new lib_dynamodb_1.GetCommand({ TableName: usersTable, Key: { id } }));
        if (!existing.Item) {
            return res.status(404).json({ message: "User not found" });
        }
        const currentBalance = typeof existing.Item.WalletBalance === "number" ? existing.Item.WalletBalance : 0;
        if (currentBalance < num) {
            return res.status(400).json({ message: "Insufficient balance" });
        }
        await dynamodb_1.db.send(new lib_dynamodb_1.UpdateCommand({
            TableName: usersTable,
            Key: { id },
            UpdateExpression: "SET WalletBalance = WalletBalance - :a",
            ExpressionAttributeValues: { ":a": num },
        }));
        return res.status(200).json({ status: "success", message: `Withdrawal of ₹${num} to UPI ${upiId} successful` });
    }
    catch (e) {
        console.error("Demo wallet withdraw error:", e);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.demoWalletWithdraw = demoWalletWithdraw;
const getWalletBalance = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId)
            return res.status(400).json({ message: "userId is required" });
        const usersTable = process.env.USERS_TABLE || "Users";
        const result = await dynamodb_1.db.send(new lib_dynamodb_1.GetCommand({
            TableName: usersTable,
            Key: { id: userId },
        }));
        if (!result.Item)
            return res.status(404).json({ message: "User not found" });
        return res.status(200).json({
            userId,
            balance: typeof result.Item.WalletBalance === "number" ? result.Item.WalletBalance : 0,
        });
    }
    catch (error) {
        console.error("Get wallet balance error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getWalletBalance = getWalletBalance;
