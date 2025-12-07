import jwt from "jsonwebtoken";

// Access Token: short-lived, includes id + role
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },                       // payload
    process.env.JWT_SECRET,                    // secret
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" } // default 15 minutes
  );
};

// Refresh Token: longer-lived, usually only id
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },                            // payload
    process.env.JWT_REFRESH_SECRET,            // secret
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" } // default 7 days
  );
};

export { generateAccessToken, generateRefreshToken };