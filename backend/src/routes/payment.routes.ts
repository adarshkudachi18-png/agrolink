import { Router } from "express";
import { createRazorpayOrder, verifyRazorpayPayment, createWalletTopupOrder, verifyWalletTopupPayment, getWalletBalance, demoWalletTopup, demoWalletWithdraw } from "../controllers/payment.controller";

const router = Router();

router.post("/create-order", createRazorpayOrder);
router.post("/verify-payment", verifyRazorpayPayment);
router.post("/wallet/create-order", createWalletTopupOrder);
router.post("/wallet/verify", verifyWalletTopupPayment);
router.post("/wallet/demo-topup", demoWalletTopup);
router.post("/wallet/demo-withdraw", demoWalletWithdraw);
router.get("/wallet/balance/:userId", getWalletBalance);

export default router;
