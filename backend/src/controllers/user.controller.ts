import { Request, Response } from "express";
import { PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { db as docClient } from "../config/dynamodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { sendNotificationEmail } from "../services/notification.service";

const USERS_TABLE = process.env.USERS_TABLE || "Users";
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const IS_PROD = process.env.NODE_ENV === "production";

// ── Cookie options ────────────────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,              // JS cannot read it — XSS proof
  secure: IS_PROD,            // HTTPS only in production
  sameSite: "lax" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
};

// ── Safe user shape ───────────────────────────────────────────────────────
function safeUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    location: user.location || null,
    pincode: user.pincode || null,
    farmName: user.farmName || null,
    farmSizeAcres: user.farmSizeAcres || null,
    businessName: user.businessName || null,
    gstNumber: user.gstNumber || null,
    createdAt: user.createdAt,
    profileCompleted: user.profileCompleted || false,
  };
}

// ── SIGNUP ────────────────────────────────────────────────────────────────
export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, phone, password, role } = req.body;
    if (!username || !email || !phone || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const scanResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: "#e = :e OR #p = :p OR #u = :u",
      ExpressionAttributeNames: { "#e": "email", "#p": "phone", "#u": "username" },
      ExpressionAttributeValues: { ":e": email, ":p": phone, ":u": username },
    }));

    if (scanResult.Items && scanResult.Items.length > 0) {
      return res.status(400).json({ message: "User with this email, phone, or username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`DEBUG OTP for ${email}: ${otp}`);

    const newUser = {
      id: uuidv4(),
      username,
      email,
      phone,
      password: hashedPassword,
      role: role || "retailer",
      isVerified: false,
      otp,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({ TableName: USERS_TABLE, Item: newUser }));

    const emailSent = await sendNotificationEmail(
      email,
      "Verify your Kisan Mitra account",
      `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#16a34a">Welcome to Kisan Mitra! 🌱</h2>
        <p>Your email verification OTP is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#16a34a;padding:16px 0">${otp}</div>
        <p style="color:#666">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>`
    );

    if (!emailSent) console.warn(`Email failed for ${email}. OTP: ${otp}`);

    res.status(201).json({
      message: emailSent ? "OTP sent to your email." : "Registered (email failed — check server logs for OTP).",
      userId: newUser.id,
    });
  } catch (error: any) {
    console.error("Signup error:", error.message);
    res.status(500).json({ message: "Internal server error", details: error.message });
  }
};

// ── VERIFY OTP ────────────────────────────────────────────────────────────
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;

    const result = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: userId },
    }));

    const user = result.Item;
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP. Please try again." });

    await docClient.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: { ...user, isVerified: true, otp: null },
    }));

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── COMPLETE PROFILE ──────────────────────────────────────────────────────
export const completeProfile = async (req: Request, res: Response) => {
  try {
    const { userId, location, pincode, farmName, farmSizeAcres, businessName, gstNumber } = req.body;

    if (!userId || !location || !pincode) {
      return res.status(400).json({ message: "userId, location, and pincode are required" });
    }

    const result = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: userId },
    }));

    const user = result.Item;
    if (!user) return res.status(404).json({ message: "User not found" });

    const updatedUser = {
      ...user,
      location,
      pincode,
      ...(farmName && { farmName }),
      ...(farmSizeAcres && { farmSizeAcres }),
      ...(businessName && { businessName }),
      ...(gstNumber && { gstNumber }),
      profileCompleted: true,
    };

    await docClient.send(new PutCommand({ TableName: USERS_TABLE, Item: updatedUser }));

    // Issue JWT and set as HTTP-only cookie — NO localStorage
    const token = jwt.sign({ id: updatedUser.id, role: updatedUser.role }, JWT_SECRET, { expiresIn: "30d" });
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(200).json({ user: safeUser(updatedUser) });
  } catch (error: any) {
    console.error("Complete profile error:", error.message);
    res.status(500).json({ message: "Internal server error", details: error.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    const scanResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: "#u = :id OR #p = :id",
      ExpressionAttributeNames: { "#u": "username", "#p": "phone" },
      ExpressionAttributeValues: { ":id": identifier },
    }));

    const user = scanResult.Items?.[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) return res.status(401).json({ message: "Please verify your account first" });

    // Issue JWT and set as HTTP-only cookie — NO localStorage
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(200).json({ user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── GET ME (reads JWT from cookie, fetches from DB) ───────────────────────
export const getMe = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);

    const result = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: decoded.id },
    }));

    const user = result.Item;
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user: safeUser(user) });
  } catch (error: any) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    console.error("Error in getMe:", error);
    res.status(500).json({ message: "Internal server error", details: error?.message || String(error) });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response) => {
  res.clearCookie("token", { httpOnly: true, secure: IS_PROD, sameSite: "lax" });
  res.status(200).json({ message: "Logged out successfully" });
};
