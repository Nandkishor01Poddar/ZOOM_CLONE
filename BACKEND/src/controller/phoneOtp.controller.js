// controller/phoneOtp.controller.js

import httpStatus from "http-status";
import {
  requestPhoneOtpService,
  verifyPhoneOtpService,
} from "../services/sms/phoneOtp.service.js";

// POST /auth/phone-otp/request
export const requestPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "phone is required",
      });
    }

    const result = await requestPhoneOtpService({ phone });

    return res.status(httpStatus.OK).json({
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error("REQUEST PHONE OTP ERROR:", error);
    return res.status(httpStatus.BAD_REQUEST).json({
      message: error.message || "Failed to request phone OTP.",
    });
  }
};

// POST /auth/phone-otp/verify
export const verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "phone and otp are required",
      });
    }

    const result = await verifyPhoneOtpService({ phone, otp });

    return res.status(httpStatus.OK).json({
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error("VERIFY PHONE OTP ERROR:", error);
    return res.status(httpStatus.BAD_REQUEST).json({
      message: error.message || "Failed to verify phone OTP.",
    });
  }
};
