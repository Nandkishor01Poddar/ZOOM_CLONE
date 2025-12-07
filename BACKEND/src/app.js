import express from "express"
import cors from "cors"

//routes
import authRoutes from "./routes/auth.route.js"

const app = express()

//middlewares
app.use(cors())
app.use(express.json({limit: "40kb"}))
app.use(express.urlencoded({limit: "40kb", extended: true}))

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

//Routes
app.use("/api/auth", authRoutes)

// simple 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;