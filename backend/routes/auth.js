const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const db = require("../db");

const router = express.Router();

/* =====================================================
   GMAIL CONFIGURATION
===================================================== */

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/* =====================================================
   OTP STORAGE
===================================================== */

const otpStore = {};
const verifiedEmailStore = {};

/* =====================================================
   SEND EMAIL OTP
===================================================== */

router.post("/send-email-otp", async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        /* Validate email */

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid Gmail address"
            });
        }

        /* Optional: only allow Gmail */

        if (!cleanEmail.endsWith("@gmail.com")) {
            return res.status(400).json({
                success: false,
                message: "Please use a Gmail address"
            });
        }

        /* Check whether email already exists */

        const [existingUsers] = await db.promise().query(
            "SELECT id FROM citizens WHERE email = ?",
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email already exists. Please use another email."
            });
        }

        /* Generate 6-digit OTP */

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        /* OTP valid for 5 minutes */

        otpStore[cleanEmail] = {
            otp: otp,
            expiresAt: Date.now() + 5 * 60 * 1000
        };

        /* Send email */

        await transporter.sendMail({
            from: `"Smart Grievance System" <${process.env.EMAIL_USER}>`,
            to: cleanEmail,
            subject: "Smart Grievance - Email Verification OTP",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    padding: 30px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                ">

                    <h2 style="color:#0d3b66;">
                        Smart Grievance System
                    </h2>

                    <p>
                        Hello,
                    </p>

                    <p>
                        Your OTP for email verification is:
                    </p>

                    <div style="
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 8px;
                        padding: 20px;
                        text-align: center;
                        background: #f4f6f8;
                        border-radius: 8px;
                        margin: 20px 0;
                    ">
                        ${otp}
                    </div>

                    <p>
                        This OTP is valid for <b>5 minutes</b>.
                    </p>

                    <p>
                        If you did not request this OTP, please ignore this email.
                    </p>

                    <hr>

                    <p style="color:#777; font-size:12px;">
                        Smart Grievance Addressing System
                    </p>

                </div>
            `
        });

        console.log(`OTP sent to ${cleanEmail}`);

        return res.json({
            success: true,
            message: "OTP sent successfully to your Gmail"
        });

    } catch (error) {

        console.error("EMAIL OTP ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send OTP email"
        });
    }
});


/* =====================================================
   VERIFY EMAIL OTP
===================================================== */

router.post("/verify-email-otp", async (req, res) => {

    try {

        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const enteredOtp = otp.toString().trim();

        const storedData = otpStore[cleanEmail];

        /* OTP doesn't exist */

        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: "OTP not found. Please request a new OTP."
            });
        }

        /* OTP expired */

        if (Date.now() > storedData.expiresAt) {

            delete otpStore[cleanEmail];

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new OTP."
            });
        }

        /* Wrong OTP */

        if (storedData.otp !== enteredOtp) {

            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        /* OTP verified */

        delete otpStore[cleanEmail];

        /* Keep email verified for 10 minutes */

        verifiedEmailStore[cleanEmail] = Date.now() + 10 * 60 * 1000;

        return res.json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (error) {

        console.error("OTP VERIFY ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "OTP verification failed"
        });
    }
});


/* =====================================================
   CHECK DUPLICATE EMAIL OR PHONE
===================================================== */

router.post("/check-duplicate", async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (email) {
            const cleanEmail = email.trim().toLowerCase();
            const [existingEmail] = await db.promise().query(
                "SELECT id FROM citizens WHERE email = ?",
                [cleanEmail]
            );

            if (existingEmail.length > 0) {
                return res.json({
                    success: false,
                    duplicate: "email",
                    message: "Email already exists. Please use another email."
                });
            }
        }

        if (phone) {
            const cleanPhone = phone.trim();
            const [existingPhone] = await db.promise().query(
                "SELECT id FROM citizens WHERE phone = ?",
                [cleanPhone]
            );

            if (existingPhone.length > 0) {
                return res.json({
                    success: false,
                    duplicate: "phone",
                    message: "Phone number already exists. Please use another number."
                });
            }
        }

        return res.json({
            success: true,
            message: "Available"
        });
    } catch (error) {
        console.error("CHECK DUPLICATE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to validate details"
        });
    }
});


/* =====================================================
   CITIZEN REGISTRATION
===================================================== */

router.post("/register", async (req, res) => {

    try {

        const {
            full_name,
            email,
            phone,
            password
        } = req.body;

        if (!full_name || !email || !phone || !password) {

            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        /* Check email verification */

        const verificationExpiry = verifiedEmailStore[cleanEmail];

        if (!verificationExpiry) {

            return res.status(400).json({
                success: false,
                message: "Please verify your Gmail before registration"
            });
        }

        /* Verification expired */

        if (Date.now() > verificationExpiry) {

            delete verifiedEmailStore[cleanEmail];

            return res.status(400).json({
                success: false,
                message: "Email verification expired. Please verify again."
            });
        }

        /* Phone validation */

        const cleanPhone = phone.trim();

        if (!/^\d{10}$/.test(cleanPhone)) {

            return res.status(400).json({
                success: false,
                message: "Phone number must contain exactly 10 digits"
            });
        }

        /* Check existing email */

        const [existingEmail] = await db.promise().query(
            "SELECT id FROM citizens WHERE email = ?",
            [cleanEmail]
        );

        if (existingEmail.length > 0) {

            return res.status(400).json({
                success: false,
                message: "Email already exists. Please use another email."
            });
        }

        /* Check existing phone */

        const [existingPhone] = await db.promise().query(
            "SELECT id FROM citizens WHERE phone = ?",
            [cleanPhone]
        );

        if (existingPhone.length > 0) {

            return res.status(400).json({
                success: false,
                message: "Phone number already exists. Please use another number."
            });
        }

        /* Strong Password Validation */
        const hasMinLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

        if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
            });
        }

        /* Hash password */

        const hashedPassword = await bcrypt.hash(password, 10);

        /* Insert citizen */

        const [result] = await db.promise().query(
            `
            INSERT INTO citizens
            (full_name, email, phone, password)
            VALUES (?, ?, ?, ?)
            `,
            [
                full_name.trim(),
                cleanEmail,
                cleanPhone,
                hashedPassword
            ]
        );

        /* Verification completed */

        delete verifiedEmailStore[cleanEmail];

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            user_id: result.insertId
        });

    } catch (error) {

        console.error("REGISTRATION ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
});


/* =====================================================
   CITIZEN LOGIN
===================================================== */

router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const [users] = await db.promise().query(
            "SELECT * FROM citizens WHERE email = ?",
            [cleanEmail]
        );

        if (users.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: "citizen"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (error) {

        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
});


module.exports = router;