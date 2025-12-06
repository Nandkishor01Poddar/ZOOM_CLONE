import { body, validationResult } from "express-validator"
import httpStatus from "http-status";

const handleValidation = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(httpStatus.BAD_REQUEST).json({
            message: "Validation error",
            errors: errors.array(),
        })
    }
    next()
}

// ---------------- REGISTER VALIDATION ----------------
export const registerValidator = [
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),

    body("username")
        .notEmpty()
        .withMessage("Username is required")
        .isLength({ min: 3, max: 20 })
        .withMessage("Username must be 3–20 characters")
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage("Username can only contain letters, numbers, and underscores"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long")
        .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
        .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
        .matches(/\d/).withMessage("Password must contain at least one number")
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Password must contain at least one special character"),

    body("role")
        .optional()
        .isIn(["user", "admin"]).withMessage("Invalid role"),

    handleValidation
]

// ---------------- LOGIN VALIDATION ----------------
export const loginValidator = [
    body("identifier")
        .notEmpty()
        .withMessage("Email or username is required")
        .isString()
        .withMessage("Identifier must be a string"),
    body("password")
        .notEmpty()
        .withMessage("Password is required"),

    handleValidation
]