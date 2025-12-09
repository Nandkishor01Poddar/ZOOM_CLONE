// services/sms/phoneOtp.service.js

import { Auth } from "../../models/auth.model.js";
import { generateOTP, hashOtp, tokenOtp } from "../../utils/Otp/otp.utils.js";
import { sendSms, toE164 } from "../../utils/sms/twilio.sms.js";
import sanitizeUser from "../../utils/user/sanitizeUser.js";

const MAX_PHONE_OTP_PER_HOUR = 5;
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * 1️⃣ Request Phone OTP (with rate limiting)
 */
export const requestPhoneOtpService = async ({ phone }) => {
  const normalizedPhone = toE164(phone);

  const user = await Auth.findOne({ phone: normalizedPhone });

  if (!user) {
    throw new Error("User not found with this phone number.");
  }

  // ================= RATE LIMIT LOGIC (PHONE) =================
  const now = Date.now();
  const windowStart = user.phoneOtpWindowStart
    ? user.phoneOtpWindowStart.getTime()
    : null;

  if (!windowStart || now - windowStart > ONE_HOUR_MS) {
    // Naya 1-hour window
    user.phoneOtpWindowStart = new Date(now);
    user.phoneOtpRequestCount = 0;
  }

  if (user.phoneOtpRequestCount >= MAX_PHONE_OTP_PER_HOUR) {
    throw new Error("Too many OTP requests. Please try again later.");
  }

  user.phoneOtpRequestCount += 1;
  // ===========================================================

  const otp = generateOTP();
  const hashed = hashOtp(otp);
  const expires = tokenOtp(5); // 5 min expiry

  user.phoneOtpCode = hashed;
  user.phoneOtpExpires = expires;

  await user.save();

  await sendSms({
    to: normalizedPhone,
    text: `Your ${process.env.APP_NAME} phone verification code is ${otp}`,
  });

  return {
    message: "OTP sent to your phone number.",
    user: sanitizeUser(user),
  };
};

/**
 * 2️⃣ Verify Phone OTP (and clear both email + phone OTP on success)
 */
export const verifyPhoneOtpService = async ({ phone, otp }) => {
  const normalizedPhone = toE164(phone);

  const user = await Auth.findOne({ phone: normalizedPhone });

  if (!user) {
    throw new Error("User not found with this phone number.");
  }

  if (!user.phoneOtpCode || !user.phoneOtpExpires) {
    throw new Error("No active phone OTP. Please request a new one.");
  }

  if (user.phoneOtpExpires < new Date()) {
    throw new Error("Phone OTP has expired. Please request a new one.");
  }

  const hashedInput = hashOtp(otp);

  if (hashedInput !== user.phoneOtpCode) {
    throw new Error("Invalid OTP.");
  }

  // ✅ PHONE verified
  user.isPhoneVerified = true;

  // 🔥 Clear ALL OTP fields (email + phone)
  user.phoneOtpCode = undefined;
  user.phoneOtpExpires = undefined;
  user.emailOtpCode = undefined;
  user.emailOtpExpires = undefined;

  user.isVerified = user.isEmailVerified || user.isPhoneVerified;

  await user.save();

  return {
    message: "Phone number verified successfully.",
    user: sanitizeUser(user),
  };
};
