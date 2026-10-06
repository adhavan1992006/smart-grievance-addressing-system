const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Database
require("./db");

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use("/uploads", express.static("uploads"));

// Routes
const authRoutes = require("./routes/auth");
const petitionRoutes = require("./routes/petition");
const adminAuth = require("./routes/adminAuth");
const officerAuth = require("./routes/officerAuth");
const feedbackRoutes = require("./routes/feedback");

// Services
const { initializeDatabase } = require("./services/initDb");
const { startEscalationScheduler } = require("./services/escalationService");

app.use("/api/auth", authRoutes);
app.use("/api/petition", petitionRoutes);
app.use("/api/admin", adminAuth);
app.use("/api/officer", officerAuth);
app.use("/api/feedback", feedbackRoutes);

// Initialize DB schema migrations and start background escalation runner
initializeDatabase();
startEscalationScheduler();

// Home Route
app.get("/", (req, res) => {
    res.send("Smart Grievance Backend Running...");
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server Running on Port ${PORT}`);
});