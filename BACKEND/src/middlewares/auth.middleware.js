// middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import { Auth } from "../models/auth.model.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // Expecting header: Authorization: Bearer <token>
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Not authorized, token missing",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await Auth.findById(decoded.id);

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Not authorized, user not found",
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);
    return res.status(httpStatus.UNAUTHORIZED).json({
      message: "Not authorized, token failed",
    });
  }
};

// Optional: role-based access
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(httpStatus.FORBIDDEN).json({
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};
