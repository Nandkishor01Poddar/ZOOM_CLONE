// utils/sms/twilio.sms.js
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Convert any phone input to E.164 format.
 * Example (India as default):
 *   "886294XXXX"   -> "+91886294XXXX"
 *   "+91886294XXXX" -> "+91886294XXXX"
 */
function toE164(phone, defaultCode = "+91") {
  if (!phone) return null;

  // keep only digits
  let digits = String(phone).replace(/\D/g, "");
  const countryDigits = defaultCode.replace("+", "");

  // if it doesn't start with country code, prepend it
  if (!digits.startsWith(countryDigits)) {
    digits = countryDigits + digits;
  }

  return `+${digits}`;
}

/**
 * Send SMS using Twilio
 * Usage: sendSms({ to: "886294XXXX", text: "Your code is 123456" })
 */
async function sendSms({ to, text }) {
  if (!to) throw new Error("Phone number (to) is required for SMS");
  if (!text) throw new Error("SMS text is required");

  const formattedTo = toE164(to);

  console.log("📲 Sending SMS to:", formattedTo);

  return client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER, // must also be E.164 in env
    to: formattedTo,
    body: text,
  });
}

export { sendSms, toE164 };
