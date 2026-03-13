import { Router } from "express";
import { signup, verifyOTP, login, completeProfile, getMe, logout } from "../controllers/user.controller";

const router = Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.post("/complete-profile", completeProfile);
router.post("/logout", logout);
router.get("/me", getMe);

export default router;
