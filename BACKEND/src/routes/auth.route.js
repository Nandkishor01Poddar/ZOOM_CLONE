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

// Unified OTP verify controller
import { verifyUnifiedOtp } from "../controller/otp.controller.js";

// 🔐 Auth + Device controllers
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getDevices,
  trustDevice,
  removeDevice,
} from "../controller/device.controller.js";

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
// (Legacy / dedicated email OTP endpoints)

// REQUEST EMAIL OTP
router.post("/request-email-otp", asyncHandler(requestEmailVerification));

// VERIFY EMAIL OTP
router.post("/verify-email", asyncHandler(verifyEmail));

// ====================== PHONE VERIFICATION ======================
// (Legacy / dedicated phone OTP endpoints)

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
 *    "type": "email",                // or "phone"
 *    "identifier": "user@mail.com",  // or phone number, e.g. "8862..." or "+9188..."
 *    "otp": "123456"
 *  }
 *
 * - type === "email" -> verifyEmailOtp(...) use hoga
 * - type === "phone" -> verifyPhoneOtpService(...) use hoga
 */
router.post("/verify-otp", asyncHandler(verifyUnifiedOtp));

// ====================== DEVICE MANAGEMENT (PROTECTED) ======================
/**
 * GET /devices
 * - Logged-in user ke saare devices return karega
 */
router.get("/devices", authMiddleware, asyncHandler(getDevices));

/**
 * PATCH /devices/:deviceId/trust
 * Body:
 *  { "isTrusted": true | false }
 */
router.patch(
  "/devices/:deviceId/trust",
  authMiddleware,
  asyncHandler(trustDevice)
);

/**
 * DELETE /devices/:deviceId
 * - User apne account se kisi device ko remove kar sakta hai
 */
router.delete(
  "/devices/:deviceId",
  authMiddleware,
  asyncHandler(removeDevice)
);

export default router;
