const { Pool } = require("pg");

function createPool() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 5432),
  });

  pool.on("error", (error) =>
    console.error("Unexpected database error:", error.message),
  );
  return pool;
}

module.exports = { createPool };
