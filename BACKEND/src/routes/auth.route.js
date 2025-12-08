import express from "express"
import { 
    registerValidator, 
    loginValidator 
} from "../validators/auth.validator.js"

import { 
    registerUser, 
    loginUser,
} from "../controller/auth.controller.js"

import {
  requestEmailVerification,
  verifyEmail,
} from "../controller/emailVerify.controller.js"

const router = express.Router()

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// REGISTER
router.post("/register", registerValidator, asyncHandler(registerUser));

// LOGIN
router.post("/login", loginValidator, asyncHandler(loginUser));

// REQUEST EMAIL OTP
router.post("/request-email-otp", asyncHandler(requestEmailVerification));

// VERIFY EMAIL OTP
router.post("/verify-email", asyncHandler(verifyEmail));

export default router;
