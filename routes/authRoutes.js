import express from "express";
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  verifyVerificationCode,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-verification-code", verifyVerificationCode);
router.post("/reset-password", resetPassword);

export default router;
