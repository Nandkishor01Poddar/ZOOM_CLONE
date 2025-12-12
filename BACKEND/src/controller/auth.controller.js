// controller/auth.controller.js

import httpStatus from "http-status";
import { Auth } from "../models/auth.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.util.js";
import {
  generateOTP,
  hashOtp,
  tokenOtp,
} from "../utils/Otp/otp.utils.js";
import sendEmail from "../utils/Email/send.email.js";
import sanitizeUser from "../utils/user/sanitizeUser.js";
import { sendSms, toE164 } from "../utils/sms/twilio.sms.js";
import { handleDeviceOnLogin } from "../services/Device/device.service.js";

// ================= REGISTER =================
const registerUser = async (req, res) => {
  try {
    const { username, email, password, role, phone } = req.body;

    if (!username || !email || !password || !role || !phone) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "username, email, phone, password and role are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    // ✅ store phone in canonical E.164 format
    const normalizedPhone = toE164(phone);

    // ✅ Check if user already exists (email / username / phone)
    const isUserAlreadyExist = await Auth.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername },
        { phone: normalizedPhone },
      ],
    });

    if (isUserAlreadyExist) {
      return res.status(httpStatus.CONFLICT).json({
        message:
          "User already registered with this email or username or phone number.",
      });
    }

    // ================== EMAIL OTP PART ==================
    const emailOtp = generateOTP(); // 6-digit for email
    const hashedEmailOtp = hashOtp(emailOtp);

    // ================== PHONE OTP PART ==================
    const phoneOtp = generateOTP(); // 6-digit for phone
    const hashedPhoneOtp = hashOtp(phoneOtp);

    const newUser = await Auth.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      role,
      phone: normalizedPhone, // ⬅️ stored as E.164

      isEmailVerified: false,
      isPhoneVerified: false,
      isVerified: false,

      emailOtpCode: hashedEmailOtp,
      emailOtpExpires: tokenOtp(5), // 5 min expiry

      phoneOtpCode: hashedPhoneOtp,
      phoneOtpExpires: tokenOtp(5), // 5 min expiry
    });

    // 📧 Send email OTP
    await sendEmail({
      to: normalizedEmail,
      subject: "Verify your email.",
      text: `Your email verification code is ${emailOtp}`,
    });

    // 📲 Send phone OTP (same normalized phone)
    await sendSms({
      to: normalizedPhone,
      text: `Your ${process.env.APP_NAME} phone verification code is ${phoneOtp}`,
    });

    const accessToken = generateAccessToken(newUser._id, newUser.role);
    const refreshToken = generateRefreshToken(newUser._id);
    const safeUser = sanitizeUser(newUser);

    return res.status(httpStatus.CREATED).json({
      message: "User registered. Please verify your email or phone.",
      accessToken,
      refreshToken,
      user: safeUser,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred while registering the user.",
      error: error.message,
    });
  }
};

// ================= LOGIN =================
const loginUser = async (req, res) => {
  try {
    const { identifier, password, deviceId, rememberDevice } = req.body;

    // Basic validation
    if (!identifier || !password) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message:
          "Identifier (email/username/phonenumber) and password are required.",
      });
    }

    const rawIdentifier = String(identifier).trim();
    const lowerIdentifier = rawIdentifier.toLowerCase();

    // Find by email OR username OR phone
    const user = await Auth.findOne({
      $or: [
        { email: lowerIdentifier }, // email stored lowercase
        { username: lowerIdentifier }, // username stored lowercase
        { phone: rawIdentifier }, // phone stored as normalized E.164
      ],
    }).select("+password"); // include password for comparison

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Invalid email/username/phone or password.",
      });
    }

    // Password verify
    const isPassValid = await user.comparePassword(password);

    if (!isPassValid) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Invalid credentials.",
      });
    }

    // ⭐ MAIN CHECK: email OR phone, koi ek verified ho
    if (!user.isVerified) {
      return res.status(httpStatus.FORBIDDEN).json({
        message: "Please verify your email or phone before logging in.",
        canRequestEmailOtp: !user.isEmailVerified,
        canRequestPhoneOtp: !user.isPhoneVerified,
      });
    }

    // ================= DEVICE-BASED SECURITY PART =================
    const userAgent = req.get("user-agent") || "unknown";
    const ip =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "unknown";

    const { user: updatedUser, isNewDevice, device } =
      await handleDeviceOnLogin({
        user,
        deviceId,
        userAgent,
        ip,
        rememberDevice,
      });

    const accessToken = generateAccessToken(updatedUser._id, updatedUser.role);
    const refreshToken = generateRefreshToken(updatedUser._id);

    const safeUser = sanitizeUser(updatedUser);

    return res.status(httpStatus.OK).json({
      message: "Logged in successfully.",
      accessToken,
      refreshToken,
      user: safeUser,
      deviceInfo: {
        isNewDevice,
        deviceId: deviceId || null,
        isTrusted: device ? device.isTrusted : null,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

export { registerUser, loginUser };
