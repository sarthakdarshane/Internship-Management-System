const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 5432)
});

pool.on("connect", () => {
    console.log("Connected to Auth Database");
});

pool.on("error", (err) => {
    console.error("Database error:", err);
});

module.exports = pool;
