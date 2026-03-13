import { Router } from "express";
import { getOrders, createOrder, updateOrderStatus, getOrdersForTransport, assignTransporter, updateDeliveryStatus } from "../controllers/order.controller";

const router = Router();

router.get("/", getOrders);
router.get("/for-transport", getOrdersForTransport);
router.post("/", createOrder);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/assign-transporter", assignTransporter);
router.patch("/:id/delivery-status", updateDeliveryStatus);

export default router;
