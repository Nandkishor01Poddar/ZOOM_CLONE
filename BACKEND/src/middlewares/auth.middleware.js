// ===================================================
// AUTH MIDDLEWARE
// - JWT verify karta hai
// - User fetch karke req.user par attach karta hai
// - Optionally: role-based access control
// ===================================================

import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import { Auth } from "../models/auth.model.js";

/**
 * authMiddleware (a.k.a protect)
 *
 * Expected:
 *  - Header: Authorization: Bearer <accessToken>
 *
 * On success:
 *  - req.user = Auth mongoose document (password excluded)
 */
export const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // 1) Header se token nikalo
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Agar token hi nahi mila
    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Not authorized, token missing",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    // 2) Token verify karo
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("JWT VERIFY ERROR:", err.message);
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Not authorized, invalid or expired token",
      });
    }

    // decoded se userId nikalna (tum generateAccessToken me `id` set kar rahe ho)
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Not authorized, invalid token payload",
      });
    }

    // 3) DB se user fetch karo (password exclude)
    const user = await Auth.findById(userId).select("-password");

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Not authorized, user not found",
      });
    }

    // 4) Attach user to request (controllers: req.user.id / req.user.role etc.)
    req.user = user;
    next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);
    return res.status(httpStatus.UNAUTHORIZED).json({
      message: "Not authorized, token failed",
    });
  }
};

// Backward compatibility: agar kahi pe protect use ho raha ho to bhi chalega
export const protect = authMiddleware;

/**
 * Role-based access control
 *
 * Usage:
 *  - router.get("/admin-only", authMiddleware, authorizeRoles("admin"), handler)
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // authMiddleware ne req.user set hi nahi kiya (ya koi bug hua)
    if (!req.user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Not authorized, user not attached to request",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(httpStatus.FORBIDDEN).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};
