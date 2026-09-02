const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const pool = require("./config/database");

const app = express();
const requiredEnvironment = ["DB_USER", "DB_HOST", "DB_NAME", "DB_PASSWORD", "JWT_SECRET"];
const missingEnvironment = requiredEnvironment.filter((key) => !process.env[key]);

if (missingEnvironment.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvironment.join(", ")}`);
}

const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
);

app.disable("x-powered-by");
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error("CORS origin is not allowed"));
    },
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"]
}));
app.use(express.json({ limit: "16kb" }));

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Internship Management System API is running"
    });
});

app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "Database Connected successfully",
            time: result.rows[0].now
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Database Connection failed"
        });
    }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
});

app.use((error, req, res, next) => {
    if (error.message === "CORS origin is not allowed") {
        return res.status(403).json({ message: "CORS origin is not allowed" });
    }

    console.error("UNHANDLED AUTH ERROR:", error);
    return res.status(500).json({ message: "Server error" });
});
