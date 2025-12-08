// controllers/auth.controller.js
import httpStatus from "http-status";
import { Auth } from "../models/auth.model.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util.js";
import { generateOTP, hashOtp, tokenOtp } from "../utils/Otp/otp.utils.js";
import sendEmail from "../utils/Email/send.email.js";
import sanitizeUser from "../utils/user/sanitizeUser.js";

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
    const normalizedPhone = String(phone).trim();

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
    const otp = generateOTP(); // default 6 digits
    const hashedOtp = hashOtp(otp);

    const newUser = await Auth.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      role,
      phone: normalizedPhone,
      isEmailVerified: false,
      isVerified: false,
      emailOtpCode: hashedOtp,
      emailOtpExpires: tokenOtp(5), // 5 min expiry
    });

    await sendEmail({
      to: normalizedEmail,
      subject: "Verify your email.",
      text: `Your verification code is ${otp}`,
    });

    // NOTE:
    // Agar tum chaho, yahan tokens na bhejo.
    const accessToken = generateAccessToken(newUser._id, newUser.role);
    const refreshToken = generateRefreshToken(newUser._id);

    const safeUser = sanitizeUser(newUser);

    return res.status(httpStatus.CREATED).json({
      message: "User registered. Please verify your email.",
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
    const { identifier, password } = req.body;

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
        { phone: rawIdentifier }, // phone as-is (with +91 etc)
      ],
    }).select("+password");

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Invalid email/username/phone or password.",
      });
    }

    const isPassValid = await user.comparePassword(password);

    if (!isPassValid) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Invalid credentials.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(httpStatus.FORBIDDEN).json({
        message: "Please verify your email before logging in.",
        canRequestEmailOtp: true,
      });
    }

    await Auth.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    );

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    const safeUser = sanitizeUser(user);

    return res.status(httpStatus.OK).json({
      message: "Logged in successfully.",
      accessToken,
      refreshToken,
      user: safeUser,
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
