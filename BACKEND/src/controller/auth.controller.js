import jwt from "jsonwebtoken"
import httpStatus from "http-status";
import { Auth } from "../models/auth.model.js"
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util.js"

// ================= REGISTER =================
const registerUser = async (req, res) => {
    try {
        const { username, email, password, role, phone } = req.body

        // Check if user already exists
        const isUserAlreadyExist = await Auth.findOne({
            $or: [{ email }, { username }, { phone }]
        })

        if (isUserAlreadyExist) {
            return res.status(httpStatus.CONFLICT).json({
                message: "User already registered with this email or username or phone number.",
            });
        }

        // Create new user
        const newUser = await Auth.create({
            username,
            email,
            password,
            role,
            phone
        })

        // Generate tokens and refresh tokens
        const accessToken = generateAccessToken(newUser._id, newUser.role);
        const refreshToken = generateRefreshToken(newUser._id);

        // Remove password before sending response
        const userObj = newUser.toObject()
        delete userObj.password

        return res.status(httpStatus.CREATED).json({
            message: "User registered successfully.",
            accessToken,
            refreshToken,
            user: userObj,
        });
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
                message: "Identifier (email/username/phonenumber) and password are required.",
            })
        }

        const stringIdentifier = typeof identifier === "string" ? identifier.trim().toLowerCase() : "";

        // Find by email OR username OR phone
        const user = await Auth.findOne({
            $or: [
                { email: stringIdentifier },
                { username: stringIdentifier },
                // if phone is stored as string in DB:
                { phone: identifier },
            ],
        }).select("+password");

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

        // ✅ Update lastLoginAt WITHOUT triggering full document validation
        await Auth.updateOne(
            { _id: user._id },
            { $set: { lastLoginAt: new Date() } }
        );

        // Generate tokens and refresh tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        const userObj = user.toObject()
        delete userObj.password

        return res.status(httpStatus.OK).json({
            message: "Logged in successfully.",
            accessToken,
            refreshToken,
            user: userObj,
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Something went wrong.",
            error: error.message,
        });
    }
}

export { registerUser, loginUser }