const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,

    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    timezone: "+05:30",

    // Aiven MySQL requires SSL
    ssl: {
        rejectUnauthorized: false
    },

    // Connection timeout
    connectTimeout: 20000
});

// Test database connection
db.getConnection((err, connection) => {
    if (err) {
        console.log("❌ MySQL Connection Failed");
        console.error("Error:", err.message);
        return;
    }

    console.log("✅ MySQL Connected (Connection Pool Ready)");

    connection.release();
});

module.exports = db;