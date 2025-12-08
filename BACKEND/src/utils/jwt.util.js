// utils/jwt.util.js
import jwt from "jsonwebtoken";

// =======================
// ACCESS TOKEN GENERATOR
// =======================
const generateAccessToken = (userId, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );
};

// =======================
// REFRESH TOKEN GENERATOR
// =======================
const generateRefreshToken = (userId) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is missing in environment variables");
  }

  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
};

// =======================
// SAFE VERIFY ACCESS TOKEN
// =======================
const verifyAccessToken = (token) => {
  try {
    return {
      ok: true,
      data: jwt.verify(token, process.env.JWT_SECRET),
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
};

// =======================
// SAFE VERIFY REFRESH TOKEN
// =======================
const verifyRefreshToken = (token) => {
  try {
    return {
      ok: true,
      data: jwt.verify(token, process.env.JWT_REFRESH_SECRET),
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
};

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
