"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const order_controller_1 = require("./controllers/order.controller");
const payment_controller_1 = require("./controllers/payment.controller");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Allow credentials + specific origin for cookies to work
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
app.use((0, cookie_parser_1.default)());
// Demo / transport routes at app level so they always respond (avoids 404 from router mount)
app.get("/api/orders/for-transport", order_controller_1.getOrdersForTransport);
app.post("/api/payments/wallet/demo-topup", payment_controller_1.demoWalletTopup);
app.post("/api/payments/wallet/demo-withdraw", payment_controller_1.demoWalletWithdraw);
// API Routes
app.use("/api/products", product_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.use("/api/notifications", notification_routes_1.default);
app.use("/api/auth", user_routes_1.default);
app.use("/api/payments", payment_routes_1.default);
// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Kisan Mitra Backend Running" });
});
// Error handler
app.use((err, req, res, next) => {
    console.error("Global error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
    });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
