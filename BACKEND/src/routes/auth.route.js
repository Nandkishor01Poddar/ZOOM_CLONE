import express from "express"
import { registerValidator, loginValidator } from "../validators/auth.validator"
import { registerUser, loginUser } from "../controller/auth.controller"

const router = express.Router()

router.post("/register", registerValidator, registerUser)


export default router