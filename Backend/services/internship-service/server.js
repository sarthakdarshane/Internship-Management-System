const express = require("express");
const cors = require("cors");

require("dotenv").config();

const internshipRoutes = require("./routes/internshipRoutes");
const pool = require("./config/database");


const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/internships", internshipRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Internship Service API is running"
    });
});

app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "Internship Database Connected successfully",
            time: result.rows[0].now
        });

    } catch (error) {
        console.error("DATABASE ERROR:", error);

        res.status(500).json({
            message: "Internship Database Connection failed",
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
    console.log(`Internship Service running on port ${PORT}`);
});