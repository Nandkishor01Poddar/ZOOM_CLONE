// src/controller/emailVerify.controller.js

import httpStatus from "http-status";
import {
  createAndSendEmailOtp,
  verifyEmailOtp,
} from "../services/email/verifyEmail.service.js";

/**
 * POST /auth/email-otp/request
 * - Email se user dhundta hai
 * - Agar already verified hai to rok deta hai
 * - Naya OTP generate karke email bhejta hai
 */
export async function requestEmailVerification(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Email is required",
      });
    }

    // Service ko raw email de do, wo khud normalize karega
    const result = await createAndSendEmailOtp(email);

    if (!result.ok) {
      // Error -> reason based status + message map
      const statusMap = {
        USER_NOT_FOUND: httpStatus.NOT_FOUND,
        ALREADY_VERIFIED: httpStatus.BAD_REQUEST,
      };

      const messageMap = {
        USER_NOT_FOUND: "User not found with this email.",
        ALREADY_VERIFIED: "Email is already verified.",
      };

      const statusCode = statusMap[result.reason] || httpStatus.BAD_REQUEST;

      return res.status(statusCode).json({
        message:
          messageMap[result.reason] || "Unable to send verification OTP.",
      });
    }

    return res.status(httpStatus.OK).json({
      message: "Verification OTP sent to your email.",
    });
  } catch (err) {
    console.error("REQUEST EMAIL OTP ERROR:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong while sending OTP.",
    });
  }
}

/**
 * POST /auth/email-otp/verify
 * - Email + OTP se verify karta hai
 * - Service se reason-based response aata hai
 */
export async function verifyEmail(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Email and OTP are required",
      });
    }

    const result = await verifyEmailOtp(email, otp);

    if (!result.ok) {
      const messageMap = {
        USER_NOT_FOUND: "User not found.",
        OTP_NOT_REQUESTED: "Please request OTP first.",
        EXPIRED: "OTP expired, please request a new one.",
        INVALID: "Invalid OTP.",
      };

      return res.status(httpStatus.BAD_REQUEST).json({
        message: messageMap[result.reason] || "Unable to verify email.",
      });
    }

    // Agar chaho to yahan userId bhi bhej sakte ho, result.userId me aa raha hai
    return res.status(httpStatus.OK).json({
      message: "Email verified successfully.",
      // userId: result.userId, // optional, agar frontend ko chahiye ho
    });
  } catch (err) {
    console.error("VERIFY EMAIL ERROR:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong while verifying email.",
    });
  }
}
