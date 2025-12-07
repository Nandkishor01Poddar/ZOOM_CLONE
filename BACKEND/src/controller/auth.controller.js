import jwt from "jsonwebtoken"
import httpStatus from "http-status";
import { Auth } from "../models/auth.model.js"

const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    )
}

// ================= REGISTER =================
const registerUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body

        // Check if user already exists
        const isUserAlreadyExist = await Auth.findOne({
            $or: [{ email }, { username }]
        })

        if (isUserAlreadyExist) {
            return res.status(httpStatus.CONFLICT).json({
                message: "User already registered with this email or username.",
            });
        }

        // Create new user
        const newUser = await Auth.create({
            username,
            email,
            password,
            role
        })

        // Generate token
        const token = generateToken(newUser._id)

        // Remove password before sending response
        const userObj = newUser.toObject()
        delete userObj.password

        return res.status(httpStatus.CREATED).json({
            message: "User registered successfully.",
            token,
            user: userObj,
        })
    } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "An error occurred while registering the user.",
            error: error.message,
        });
    }
}

// ================= LOGIN =================
const loginUser = async (req, res) => {
    try {
        const { identifier, password } = req.body

        if (!identifier || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Identifier (email/username) and password are required.",
            })
        }

        // Find by email OR username
        const user = await Auth.findOne({
            $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }]
        }).select("+password")

        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Invalid email/username or password.",
            })
        }

        const isPassValid = await user.comparePassword(password)

        if (!isPassValid) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Invalid credentials.",
            });
        }

        // lastLoginAt update
        user.lastLoginAt = new Date()
        await user.save()

        const token = generateToken(user._id)

        const userObj = user.toObject()
        delete userObj.password

        return res.status(httpStatus.OK).json({
            message: "Logged in successfully.",
            token,
            user: userObj,
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Something went wrong.",
        });
    }
}

export { registerUser, loginUser }