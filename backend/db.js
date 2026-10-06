const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "+05:30"
});

// Test initial pool connection
db.getConnection((err, connection) => {
    if (err) {
        console.log("❌ MySQL Connection Failed");
        console.log(err);
    } else {
        console.log("✅ MySQL Connected (Connection Pool Ready)");
        connection.release();
    }
});

module.exports = db;