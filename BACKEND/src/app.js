import express from "express"
import cors from "cors"

//routes
import authRoutes from "./routes/auth.route"

const app = express()

//middlewares
app.use(cors())
app.use(express.json({limit: "40kb"}))
app.use(express.urlencoded({limit: "40kb", extended: true}))

//Routes
app.use("/api/auth", authRoutes)

export default app;