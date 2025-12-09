// src/services/verifyEmail.service.js

import { Auth } from "../../models/auth.model.js";
import sendEmail from "../../utils/Email/send.email.js";
import { generateOTP, hashOtp, tokenOtp } from "../../utils/Otp/otp.utils.js";

const MAX_EMAIL_OTP_PER_HOUR = 5;
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * 1️⃣ Create & Send Email OTP (with rate limiting)
 */
export async function createAndSendEmailOtp(email) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await Auth.findOne({ email: normalizedEmail });

  if (!user) {
    return { ok: false, reason: "USER_NOT_FOUND" };
  }

  if (user.isEmailVerified) {
    return { ok: false, reason: "ALREADY_VERIFIED" };
  }

  // ================= RATE LIMIT LOGIC (EMAIL) =================
  const now = Date.now();
  const windowStart = user.emailOtpWindowStart
    ? user.emailOtpWindowStart.getTime()
    : null;

  if (!windowStart || now - windowStart > ONE_HOUR_MS) {
    // Naya 1-hour window start
    user.emailOtpWindowStart = new Date(now);
    user.emailOtpRequestCount = 0;
  }

  if (user.emailOtpRequestCount >= MAX_EMAIL_OTP_PER_HOUR) {
    return { ok: false, reason: "TOO_MANY_REQUESTS" };
  }

  user.emailOtpRequestCount += 1;
  // ===========================================================

  // Naya OTP generate karo
  const otp = generateOTP();
  const otpHash = hashOtp(otp);
  const expiresAt = tokenOtp(5); // 5 minutes expiry

  user.emailOtpCode = otpHash;
  user.emailOtpExpires = expiresAt;
  user.isEmailVerified = false;

  await user.save();

  // Email bhejo
  await sendEmail({
    to: user.email,
    subject: "Your Email Verification Code",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    html: `<p>Your OTP is <b>${otp}</b></p><p>It is valid for 5 minutes.</p>`,
  });

  return { ok: true };
}

/**
 * 2️⃣ Verify Email OTP (and clear both email + phone OTP on success)
 */
export async function verifyEmailOtp(email, otp) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await Auth.findOne({ email: normalizedEmail });

  if (!user) {
    return { ok: false, reason: "USER_NOT_FOUND" };
  }

  if (!user.emailOtpCode || !user.emailOtpExpires) {
    return { ok: false, reason: "OTP_NOT_REQUESTED" };
  }

  const now = new Date();

  if (user.emailOtpExpires <= now) {
    user.emailOtpCode = undefined;
    user.emailOtpExpires = undefined;
    await user.save();

    return { ok: false, reason: "EXPIRED" };
  }

  const hashedFromUser = hashOtp(otp);

  if (hashedFromUser !== user.emailOtpCode) {
    return { ok: false, reason: "INVALID" };
  }

  // ✅ SUCCESS: Email verified
  user.isEmailVerified = true;

  // 🔥 New rule: ek channel verify → saare OTP clear
  user.emailOtpCode = undefined;
  user.emailOtpExpires = undefined;
  user.phoneOtpCode = undefined;
  user.phoneOtpExpires = undefined;

  user.isVerified = Boolean(user.isEmailVerified || user.isPhoneVerified);

  await user.save();

  return {
    ok: true,
    userId: user._id,
  };
}
