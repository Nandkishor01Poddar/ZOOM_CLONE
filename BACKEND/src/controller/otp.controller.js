// src/controller/otp.controller.js

import httpStatus from "http-status";
import { verifyEmailOtp } from "../services/email/verifyEmail.service.js";
import { verifyPhoneOtpService } from "../services/sms/phoneOtp.service.js";

/**
 * POST /auth/otp/verify
 *
 * Body:
 *  {
 *    "type": "email" | "phone",
 *    "identifier": "<email or phone>",
 *    "otp": "123456"
 *  }
 *
 * Flow:
 *  - type ke basis pe email/phone service call
 *  - har service ka response ko unify karke frontend ko simple response
 */
export async function verifyUnifiedOtp(req, res) {
  try {
    const { type, identifier, otp } = req.body;

    if (!type || !identifier || !otp) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "type, identifier and otp are required.",
      });
    }

    if (type !== "email" && type !== "phone") {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "type must be either 'email' or 'phone'.",
      });
    }

    // Ye object hum response normalize karne ke liye use karenge
    let success = false;
    let reason = null;
    let userInfo = null;

    if (type === "email") {
      // Email service already { ok, reason } return karti hai
      const result = await verifyEmailOtp(identifier, otp);

      success = result.ok;
      reason = result.reason || null;
      if (result.ok) {
        userInfo = { userId: result.userId };
      }
    } else if (type === "phone") {
      // Phone service error throw karti hai, so try/catch
      try {
        const result = await verifyPhoneOtpService({
          phone: identifier,
          otp,
        });

        success = true;
        userInfo = { user: result.user };
      } catch (err) {
        // Message ko reason me map kar sakte ho
        const msg = err.message || "";
        if (msg.includes("not found")) reason = "USER_NOT_FOUND";
        else if (msg.includes("expired")) reason = "EXPIRED";
        else if (msg.includes("active phone OTP")) reason = "OTP_NOT_REQUESTED";
        else if (msg.includes("Invalid OTP")) reason = "INVALID";
        else reason = "UNKNOWN";
      }
    }

    if (!success) {
      const messageMap = {
        USER_NOT_FOUND: "User not found.",
        OTP_NOT_REQUESTED: "Please request OTP first.",
        EXPIRED: "OTP expired, please request a new one.",
        INVALID: "Invalid OTP.",
        UNKNOWN: "Unable to verify OTP.",
      };

      return res.status(httpStatus.BAD_REQUEST).json({
        message: messageMap[reason] || "Unable to verify OTP.",
        reason,
      });
    }

    // ✅ Unified success response
    return res.status(httpStatus.OK).json({
      message: "Verification successful.",
      ...userInfo,
      // type bhi bhej sakte ho frontend ke liye
      type,
    });
  } catch (err) {
    console.error("VERIFY UNIFIED OTP ERROR:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong while verifying OTP.",
    });
  }
}
