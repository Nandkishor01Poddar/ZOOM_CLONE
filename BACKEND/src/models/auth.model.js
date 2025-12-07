import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const authSchema = new Schema(
  {
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
      select: false, // password by default query me nahi aayega
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true, // "+91..." format recommended
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // MAIN FLAG: agar email OR phone verified -> true
    isVerified: {
      type: Boolean,
      default: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    // Email OTP
    emailOtpCode: String,
    emailOtpExpires: Date,

    // Phone OTP
    phoneOtpCode: String,
    phoneOtpExpires: Date,

    // Forgot password reset token (hashed) + expiry
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// 🔐 Hash password before save (async style, NO next)
authSchema.pre("save", async function () {
  if (!this.isModified("password")) return

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// ✅ Instance method for password comparison
authSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

const Auth = mongoose.model("Auth", authSchema);

export { Auth };