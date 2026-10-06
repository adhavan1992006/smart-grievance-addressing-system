const jwt = require("jsonwebtoken");

/**
 * Middleware to verify JWT token from Authorization header
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. Authentication token required."
        });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("FATAL ERROR: JWT_SECRET environment variable is missing.");
        return res.status(500).json({
            success: false,
            message: "Internal server configuration error."
        });
    }

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired authentication token. Please log in again."
            });
        }

        req.user = decoded; // { id, email, role, username }
        next();
    });
};

/**
 * Middleware to enforce role-based access control
 * @param {...string} allowedRoles
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Insufficient permissions for this resource."
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole
};
