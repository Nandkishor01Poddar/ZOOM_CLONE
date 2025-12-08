import { body, validationResult } from "express-validator";
import httpStatus from "http-status";

// ---------------- COMMON VALIDATION HANDLER ----------------
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "Validation error",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

// Reusable regex patterns
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
// Example phone: only digits, 10–15 chars (adjust for your region if needed)
const PHONE_REGEX = /^[0-9]{10,15}$/;

// ---------------- REGISTER VALIDATION ----------------
export const registerValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters")
    .matches(USERNAME_REGEX)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(PHONE_REGEX)
    .withMessage("Phone number must contain only digits and be 10–15 characters long"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),

  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be either 'user' or 'admin'"),

  handleValidation,
];

// ---------------- LOGIN VALIDATION ----------------
export const loginValidator = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Email, username, or phone number is required")
    .isString()
    .withMessage("Identifier must be a string"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),

  handleValidation,
];
