import express from "express"
import { registerValidator, loginValidator } from "../validators/auth.validator.js"
import { registerUser, loginUser } from "../controller/auth.controller.js"

const router = express.Router()

router.post("/register", registerValidator, registerUser)
router.post("/login", loginValidator, loginUser)


export default router