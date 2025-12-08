// src/controller/emailVerify.controller.js
import httpStatus from "http-status";
import {
  createAndSendEmailOtp,
  verifyEmailOtp,
} from "../services/email/verifyEmail.service.js";

export async function requestEmailVerification(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Email is required",
      });
    }

    const result = await createAndSendEmailOtp(email);

    if (!result.ok) {
      const mapStatus = {
        USER_NOT_FOUND: httpStatus.NOT_FOUND,
        ALREADY_VERIFIED: httpStatus.BAD_REQUEST,
      };

      const statusCode = mapStatus[result.reason] || httpStatus.BAD_REQUEST;

      const msgMap = {
        USER_NOT_FOUND: "User not found with this email.",
        ALREADY_VERIFIED: "Email is already verified.",
      };

      return res.status(statusCode).json({
        message: msgMap[result.reason] || "Unable to send verification OTP.",
      });
    }

    return res.status(httpStatus.OK).json({
      message: "Verification OTP sent to your email.",
    });
  } catch (err) {
    console.error("REQUEST EMAIL OTP ERROR:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong while sending OTP",
    });
  }
}

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
      const map = {
        USER_NOT_FOUND: "User not found.",
        OTP_NOT_REQUESTED: "Please request OTP first.",
        EXPIRED: "OTP expired, please request a new one.",
        INVALID: "Invalid OTP.",
      };

      return res.status(httpStatus.BAD_REQUEST).json({
        message: map[result.reason] || "Unable to verify email.",
      });
    }

    return res.status(httpStatus.OK).json({
      message: "Email verified successfully.",
    });
  } catch (err) {
    console.error("VERIFY EMAIL ERROR:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong while verifying email",
    });
  }
}