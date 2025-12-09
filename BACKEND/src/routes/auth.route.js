import express from "express";

import {
  registerValidator,
  loginValidator,
} from "../validators/auth.validator.js";

import {
  registerUser,
  loginUser,
} from "../controller/auth.controller.js";

import {
  requestEmailVerification,
  verifyEmail,
} from "../controller/emailVerify.controller.js";

import {
  requestPhoneOtp,
  verifyPhoneOtp,
} from "../controller/phoneOtp.controller.js";

// 🔥 NEW: unified OTP verify controller
import { verifyUnifiedOtp } from "../controller/otp.controller.js";

const router = express.Router();

// Async wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ====================== AUTH ======================

// REGISTER
router.post("/register", registerValidator, asyncHandler(registerUser));

// LOGIN
router.post("/login", loginValidator, asyncHandler(loginUser));

// ====================== EMAIL VERIFICATION ======================
// (Legacy / dedicated email OTP endpoints, fully working)

// REQUEST EMAIL OTP
router.post("/request-email-otp", asyncHandler(requestEmailVerification));

// VERIFY EMAIL OTP
router.post("/verify-email", asyncHandler(verifyEmail));

// ====================== PHONE VERIFICATION ======================
// (Legacy / dedicated phone OTP endpoints, fully working)

// REQUEST PHONE OTP
router.post("/request-phone-otp", asyncHandler(requestPhoneOtp));

// VERIFY PHONE OTP
router.post("/verify-phone", asyncHandler(verifyPhoneOtp));

// ====================== UNIFIED OTP VERIFICATION ======================
/**
 * POST /verify-otp
 *
 * Body example:
 *  {
 *    "type": "email",          // or "phone"
 *    "identifier": "user@mail.com", // or phone number, e.g. "8862..." ya "+9188..."
 *    "otp": "123456"
 *  }
 *
 * - Agar type === "email"  -> verifyEmailOtp(...) use hoga
 * - Agar type === "phone"  -> verifyPhoneOtpService(...) use hoga
 * - Response:
 *    - success: { message: "Verification successful.", ... }
 *    - fail:    { message: "...", reason: "INVALID" | "EXPIRED" | ... }
 */
router.post("/verify-otp", asyncHandler(verifyUnifiedOtp));

export default router;
