// src/services/verifyEmail.service.js
import { Auth } from "../../models/auth.model.js";
import sendEmail from "../../utils/Email/send.email.js";
import { generateOTP, hashOtp, tokenOtp } from "../../utils/Otp/otp.utils.js";

// 1️⃣ OTP create + user pe save + email send
export async function createAndSendEmailOtp(email) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await Auth.findOne({ email: normalizedEmail });

  if (!user) {
    return { ok: false, reason: "USER_NOT_FOUND" };
  }

  if (user.isEmailVerified) {
    return { ok: false, reason: "ALREADY_VERIFIED" };
  }

  const otp = generateOTP();
  const otpHash = hashOtp(otp);
  const expiresAt = tokenOtp(5); // 5 minutes

  user.emailOtpCode = otpHash;
  user.emailOtpExpires = expiresAt;
  user.isEmailVerified = false;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Your Email Verification Code",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    html: `<p>Your OTP is <b>${otp}</b></p><p>It is valid for 5 minutes.</p>`,
  });

  return { ok: true };
}

// 2️⃣ OTP verify logic
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

  // ✅ Success
  user.isEmailVerified = true;
  user.isVerified = Boolean(user.isEmailVerified || user.isPhoneVerified);

  user.emailOtpCode = undefined;
  user.emailOtpExpires = undefined;

  await user.save();

  return {
    ok: true,
    userId: user._id,
  };
}
