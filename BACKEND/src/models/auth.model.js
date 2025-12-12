// models/auth.model.js
// =============================================================
// USER AUTH MODEL (CLEANED + ORGANIZED + DEVICE-BASED SECURITY)
// =============================================================

import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

// -------------------------------------------------------------
//  DEVICE SCHEMA (Used for device-based login security)
// -------------------------------------------------------------
// Each login device gets a record:
// - deviceId: frontend-generated UUID stored in localStorage
// - userAgent: Browser/OS info
// - ip: IP address of login attempt
// - isTrusted: true if user marked device as trusted
// - firstLoginAt: first time device used
// - lastLoginAt: last time device logged in
// -------------------------------------------------------------
const DeviceSchema = new Schema({
  deviceId: { type: String, required: true },
  userAgent: { type: String },
  ip: { type: String },
  isTrusted: { type: Boolean, default: false },
  firstLoginAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now },
});

// -------------------------------------------------------------
//  MAIN AUTH SCHEMA
// -------------------------------------------------------------
const authSchema = new Schema(
  {
    // -------------------------------
    // Basic required fields
    // -------------------------------
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Never return password in queries unless explicitly selected
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true, // Stored in +91... E.164 format
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // -------------------------------
    // Verification Flags
    // -------------------------------
    isVerified: {
      type: Boolean,
      default: false, // True if email OR phone is verified
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    // -------------------------------
    // Email OTP (hashed + expiry)
    // -------------------------------
    emailOtpCode: { type: String },
    emailOtpExpires: { type: Date },

    // -------------------------------
    // Phone OTP (hashed + expiry)
    // -------------------------------
    phoneOtpCode: { type: String },
    phoneOtpExpires: { type: Date },

    // -------------------------------
    // EMAIL OTP Rate Limiting
    // - Max 5 requests per hour
    // -------------------------------
    emailOtpRequestCount: { type: Number, default: 0 },
    emailOtpWindowStart: { type: Date, default: null },

    // -------------------------------
    // PHONE OTP Rate Limiting
    // -------------------------------
    phoneOtpRequestCount: { type: Number, default: 0 },
    phoneOtpWindowStart: { type: Date, default: null },

    // -------------------------------
    // FORGOT PASSWORD / RESET TOKEN
    // -------------------------------
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // -------------------------------
    // LOGIN HISTORY
    // -------------------------------
    lastLoginAt: { type: Date, default: null },

    // -------------------------------
    // DEVICE-BASED LOGIN SECURITY
    // -------------------------------
    devices: {
      type: [DeviceSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// -------------------------------------------------------------
//  PASSWORD HASHING (Before save)
// -------------------------------------------------------------
authSchema.pre("save", async function () {
  // Run only if password modified
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// -------------------------------------------------------------
//  PASSWORD COMPARISON METHOD
// -------------------------------------------------------------
authSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// -------------------------------------------------------------
//  EXPORT MODEL
// -------------------------------------------------------------
const Auth = mongoose.model("Auth", authSchema);
export { Auth };
