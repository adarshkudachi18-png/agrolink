import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import productRoutes from "./routes/product.routes";
import orderRoutes from "./routes/order.routes";
import notificationRoutes from "./routes/notification.routes";
import userRoutes from "./routes/user.routes";
import paymentRoutes from "./routes/payment.routes";
import { getOrdersForTransport } from "./controllers/order.controller";
import { demoWalletTopup, demoWalletWithdraw } from "./controllers/payment.controller";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Allow credentials + specific origin for cookies to work
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Demo / transport routes at app level so they always respond (avoids 404 from router mount)
app.get("/api/orders/for-transport", getOrdersForTransport);
app.post("/api/payments/wallet/demo-topup", demoWalletTopup);
app.post("/api/payments/wallet/demo-withdraw", demoWalletWithdraw);

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/payments", paymentRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Kisan Mitra Backend Running" });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
