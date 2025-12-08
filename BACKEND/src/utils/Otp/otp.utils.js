import crypto from "crypto";

export function generateOTP(digits = 6) {
  const max = 10 ** digits;
  const otp = Math.floor(Math.random() * max);
  return otp.toString().padStart(digits, "0");
}

export function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// Expiry time
export function tokenOtp(minutes = 5) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
