const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const db = require("../db");

const { sendOfficerOtpEmail } = require("../services/emailService");

const {
    authenticateToken,
    requireRole
} = require("../middleware/auth");

const router = express.Router();

/* =====================================================
   TEMPORARY OTP STORAGE
===================================================== */

const adminOfficerOtpStore = {};
const adminVerifiedOfficerEmails = {};


/* =====================================================
   ADMIN LOGIN
===================================================== */

router.post("/login", (req, res) => {

    const { username, password } = req.body;

    const expectedUser = process.env.ADMIN_USERNAME || "admin";
    const expectedPass = process.env.ADMIN_PASSWORD || "admin1234";

    if (
        username === expectedUser &&
        password === expectedPass
    ) {

        const token = jwt.sign(
            {
                id: 1,
                role: "admin",
                username: expectedUser
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "24h"
            }
        );

        return res.json({
            success: true,
            message: "Admin Login Successful",
            token,
            admin: {
                id: 1,
                username: expectedUser
            }
        });
    }

    return res.status(401).json({
        success: false,
        message: "Invalid Username or Password"
    });
});


/* =====================================================
   ALL BELOW ROUTES REQUIRE ADMIN LOGIN
===================================================== */

router.use(
    authenticateToken,
    requireRole("admin")
);


/* =====================================================
   SEND OFFICER REGISTRATION OTP
===================================================== */

router.post(
    "/send-officer-otp",
    async (req, res) => {

        try {

            const {
                email,
                full_name
            } = req.body;

            /* -----------------------------------------
               BASIC VALIDATION
            ----------------------------------------- */

            if (!email) {

                return res.status(400).json({
                    success: false,
                    message: "Officer Gmail address is required"
                });
            }

            const cleanEmail =
                email.trim().toLowerCase();


            /* -----------------------------------------
               ONLY GMAIL
            ----------------------------------------- */

            if (
                !cleanEmail.endsWith("@gmail.com")
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Only Gmail addresses (@gmail.com) are accepted for officer creation"
                });
            }


            /* -----------------------------------------
               CHECK EXISTING EMAIL
            ----------------------------------------- */

            db.query(
                "SELECT id FROM officers WHERE email = ?",
                [cleanEmail],
                async (err, result) => {

                    if (err) {

                        console.error(
                            "Officer email check error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Database error"
                        });
                    }


                    if (
                        result &&
                        result.length > 0
                    ) {

                        return res.status(400).json({
                            success: false,
                            message:
                                "Email is already registered for an existing officer."
                        });
                    }


                    /* ---------------------------------
                       GENERATE OTP
                    --------------------------------- */

                    const otp =
                        Math.floor(
                            100000 +
                            Math.random() * 900000
                        ).toString();


                    adminOfficerOtpStore[
                        cleanEmail
                    ] = {

                        otp,

                        expiresAt:
                            Date.now() +
                            5 * 60 * 1000
                    };


                    /* ---------------------------------
                       SEND OTP EMAIL
                    --------------------------------- */

                    try {

                        await sendOfficerOtpEmail(
                            cleanEmail,
                            full_name || "Officer",
                            otp
                        );

                    } catch (emailError) {

                        console.error(
                            "Officer OTP email error:",
                            emailError
                        );

                        delete adminOfficerOtpStore[
                            cleanEmail
                        ];

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to send OTP to Gmail"
                        });
                    }


                    return res.json({
                        success: true,
                        message:
                            "OTP sent successfully to officer's Gmail"
                    });
                }
            );

        } catch (error) {

            console.error(
                "SEND OFFICER OTP ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to send OTP to Gmail"
            });
        }
    }
);


/* =====================================================
   VERIFY OFFICER REGISTRATION OTP
===================================================== */

router.post(
    "/verify-officer-otp",
    (req, res) => {

        const {
            email,
            otp
        } = req.body;


        if (!email || !otp) {

            return res.status(400).json({
                success: false,
                message:
                    "Email and OTP code are required"
            });
        }


        const cleanEmail =
            email.trim().toLowerCase();

        const enteredOtp =
            otp.toString().trim();


        const storedData =
            adminOfficerOtpStore[
                cleanEmail
            ];


        if (!storedData) {

            return res.status(400).json({
                success: false,
                message:
                    "OTP not found or expired. Please request a new OTP."
            });
        }


        /* -----------------------------------------
           CHECK EXPIRATION
        ----------------------------------------- */

        if (
            Date.now() >
            storedData.expiresAt
        ) {

            delete adminOfficerOtpStore[
                cleanEmail
            ];

            return res.status(400).json({
                success: false,
                message:
                    "OTP has expired. Please request a new OTP."
            });
        }


        /* -----------------------------------------
           CHECK OTP
        ----------------------------------------- */

        if (
            storedData.otp !==
            enteredOtp
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid OTP code. Please check and try again."
            });
        }


        /* -----------------------------------------
           OTP VERIFIED
        ----------------------------------------- */

        delete adminOfficerOtpStore[
            cleanEmail
        ];


        adminVerifiedOfficerEmails[
            cleanEmail
        ] =
            Date.now() +
            15 * 60 * 1000;


        return res.json({
            success: true,
            message:
                "Gmail verified successfully!"
        });
    }
);


/* =====================================================
   ADD OFFICER
===================================================== */

router.post(
    "/add-officer",
    async (req, res) => {

        try {

            const {
                full_name,
                email,
                password,
                department_id,
                officer_type,
                sub_role
            } = req.body;


            /* -----------------------------------------
               BASIC VALIDATION
            ----------------------------------------- */

            if (
                !full_name ||
                !email ||
                !password
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Name, email and password are required"
                });
            }


            const cleanName =
                full_name.trim();

            const cleanEmail =
                email.trim().toLowerCase();


            /* -----------------------------------------
               ONLY GMAIL
            ----------------------------------------- */

            if (
                !cleanEmail.endsWith("@gmail.com")
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Only Gmail addresses (@gmail.com) are accepted."
                });
            }


            /* -----------------------------------------
               OTP VERIFICATION
            ----------------------------------------- */

            if (
                !adminVerifiedOfficerEmails[
                    cleanEmail
                ] ||
                Date.now() >
                adminVerifiedOfficerEmails[
                    cleanEmail
                ]
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Gmail OTP verification is required before creating an officer account."
                });
            }


            /* -----------------------------------------
               PASSWORD VALIDATION
            ----------------------------------------- */

            const isPasswordValid =
                password.length >= 8 &&
                /[A-Z]/.test(password) &&
                /[a-z]/.test(password) &&
                /[0-9]/.test(password) &&
                /[@$!%*?&]/.test(password);


            if (!isPasswordValid) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Password must contain at least 8 characters, uppercase, lowercase, number and special character."
                });
            }


            /* -----------------------------------------
               DETERMINE OFFICER TYPE
            -----------------------------------------

               Preferred frontend field:

               officer_type = "department"
               OR
               officer_type = "municipal"

               sub_role is also accepted for backward
               compatibility.
            */

            let finalOfficerType =
                officer_type || sub_role || "department";


            finalOfficerType =
                finalOfficerType
                    .toString()
                    .trim()
                    .toLowerCase();


            /* -----------------------------------------
               VALID OFFICER TYPES
            ----------------------------------------- */

            if (
                finalOfficerType !== "department" &&
                finalOfficerType !== "municipal"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid officer type. Use 'department' or 'municipal'."
                });
            }


            /* -----------------------------------------
               KEEP SUB ROLE SYNCHRONIZED
            ----------------------------------------- */

            const finalSubRole =
                finalOfficerType;


            /* -----------------------------------------
               DEPARTMENT ID
            ----------------------------------------- */

            let finalDepartmentId = null;

            if (
                finalOfficerType === "department"
            ) {

                if (
                    department_id === undefined ||
                    department_id === null ||
                    department_id === "" ||
                    isNaN(parseInt(department_id))
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Department selection is required for Department Officers."
                    });
                }


                finalDepartmentId =
                    parseInt(department_id);
            }


            /* -----------------------------------------
               CHECK EXISTING EMAIL
            ----------------------------------------- */

            db.query(
                "SELECT id FROM officers WHERE email = ?",
                [cleanEmail],
                async (err, result) => {

                    if (err) {

                        console.error(
                            "Officer email check error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Database error while checking officer email"
                        });
                    }


                    if (
                        result &&
                        result.length > 0
                    ) {

                        return res.status(400).json({
                            success: false,
                            message:
                                "Email already exists. Please use another email."
                        });
                    }


                    /* ---------------------------------
                       HASH PASSWORD
                    --------------------------------- */

                    let hashedPassword;

                    try {

                        hashedPassword =
                            await bcrypt.hash(
                                password,
                                10
                            );

                    } catch (hashError) {

                        console.error(
                            "Password hashing error:",
                            hashError
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to secure password"
                        });
                    }


                    /* ---------------------------------
                       INSERT OFFICER
                    --------------------------------- */

                    const insertOfficer = (
                        departmentName
                    ) => {

                        const insertQuery = `
                            INSERT INTO officers
                            (
                                full_name,
                                email,
                                password,
                                department,
                                department_id,
                                officer_type,
                                sub_role,
                                is_active
                            )
                            VALUES
                            (
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                ?,
                                1
                            )
                        `;


                        const values = [
                            cleanName,
                            cleanEmail,
                            hashedPassword,
                            departmentName,
                            finalDepartmentId,
                            finalOfficerType,
                            finalSubRole
                        ];


                        db.query(
                            insertQuery,
                            values,
                            (insertErr, insertResult) => {

                                if (insertErr) {

                                    console.error(
                                        "Add officer database error:",
                                        insertErr
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            "Failed to create officer account"
                                    });
                                }


                                /* -------------------------
                                   REMOVE OTP VERIFICATION
                                ------------------------- */

                                delete adminVerifiedOfficerEmails[
                                    cleanEmail
                                ];


                                return res.json({
                                    success: true,

                                    message:
                                        "Officer Added Successfully",

                                    officer: {
                                        id:
                                            insertResult.insertId,

                                        full_name:
                                            cleanName,

                                        email:
                                            cleanEmail,

                                        department:
                                            departmentName,

                                        department_id:
                                            finalDepartmentId,

                                        officer_type:
                                            finalOfficerType,

                                        sub_role:
                                            finalSubRole,

                                        is_active:
                                            1
                                    }
                                });
                            }
                        );
                    };


                    /* ---------------------------------
                       MUNICIPAL OFFICER
                    --------------------------------- */

                    if (
                        finalOfficerType === "municipal"
                    ) {

                        insertOfficer(null);

                        return;
                    }


                    /* ---------------------------------
                       DEPARTMENT OFFICER
                    --------------------------------- */

                    db.query(
                        `
                        SELECT
                            id,
                            department_name
                        FROM departments
                        WHERE id = ?
                        `,
                        [finalDepartmentId],
                        (deptErr, deptRows) => {

                            if (deptErr) {

                                console.error(
                                    "Department lookup error:",
                                    deptErr
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Failed to verify department"
                                });
                            }


                            if (
                                !deptRows ||
                                deptRows.length === 0
                            ) {

                                return res.status(404).json({
                                    success: false,
                                    message:
                                        "Selected department was not found"
                                });
                            }


                            insertOfficer(
                                deptRows[0]
                                    .department_name
                            );
                        }
                    );
                }
            );

        } catch (error) {

            console.error(
                "ADD OFFICER ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to create officer"
            });
        }
    }
);


/* =====================================================
   VIEW ALL OFFICERS
===================================================== */

router.get(
    "/officers",
    (req, res) => {

        const query = `
            SELECT
                id,
                full_name,
                email,
                department,
                department_id,
                officer_type,
                sub_role,
                is_active,
                created_at
            FROM officers
            ORDER BY id DESC
        `;


        db.query(
            query,
            (err, result) => {

                if (err) {

                    console.error(
                        "View officers error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Failed to load officers"
                    });
                }


                return res.json({
                    success: true,
                    officers:
                        result || []
                });
            }
        );
    }
);


/* =====================================================
   UPDATE OFFICER
===================================================== */

router.put(
    "/officer/:id",
    async (req, res) => {

        try {

            const { id } =
                req.params;

            const {
                full_name,
                email,
                password,
                department_id,
                officer_type,
                sub_role
            } = req.body;


            /* -----------------------------------------
               BASIC VALIDATION
            ----------------------------------------- */

            if (
                !full_name ||
                !email
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Name and email are required"
                });
            }


            const cleanName =
                full_name.trim();

            const cleanEmail =
                email.trim().toLowerCase();


            /* -----------------------------------------
               ONLY GMAIL
            ----------------------------------------- */

            if (
                !cleanEmail.endsWith("@gmail.com")
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Only Gmail addresses (@gmail.com) are accepted."
                });
            }


            /* -----------------------------------------
               DETERMINE OFFICER TYPE
            ----------------------------------------- */

            let finalOfficerType =
                officer_type || sub_role;


            /*
             * If no officer type is supplied,
             * preserve existing officer type.
             */

            if (!finalOfficerType) {

                db.query(
                    `
                    SELECT
                        officer_type,
                        sub_role,
                        department_id
                    FROM officers
                    WHERE id = ?
                    `,
                    [id],
                    (existingErr, existingRows) => {

                        if (existingErr) {

                            console.error(
                                "Existing officer lookup error:",
                                existingErr
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Failed to load existing officer"
                            });
                        }


                        if (
                            !existingRows ||
                            existingRows.length === 0
                        ) {

                            return res.status(404).json({
                                success: false,
                                message:
                                    "Officer not found"
                            });
                        }


                        const existingOfficer =
                            existingRows[0];


                        performOfficerUpdate(
                            existingOfficer.officer_type ||
                            existingOfficer.sub_role ||
                            "department",
                            department_id !== undefined
                                ? department_id
                                : existingOfficer.department_id
                        );
                    }
                );

                return;
            }


            finalOfficerType =
                finalOfficerType
                    .toString()
                    .trim()
                    .toLowerCase();


            performOfficerUpdate(
                finalOfficerType,
                department_id
            );


            /* =================================================
               UPDATE FUNCTION
            ================================================= */

            function performOfficerUpdate(
                officerType,
                suppliedDepartmentId
            ) {

                /* -----------------------------------------
                   VALID OFFICER TYPE
                ----------------------------------------- */

                if (
                    officerType !== "department" &&
                    officerType !== "municipal"
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid officer type. Use 'department' or 'municipal'."
                    });
                }


                const finalSubRole =
                    officerType;


                /* -----------------------------------------
                   DEPARTMENT ID
                ----------------------------------------- */

                let finalDepartmentId = null;


                if (
                    officerType === "department"
                ) {

                    if (
                        suppliedDepartmentId === undefined ||
                        suppliedDepartmentId === null ||
                        suppliedDepartmentId === "" ||
                        isNaN(parseInt(suppliedDepartmentId))
                    ) {

                        return res.status(400).json({
                            success: false,
                            message:
                                "Department selection is required for Department Officers."
                        });
                    }


                    finalDepartmentId =
                        parseInt(suppliedDepartmentId);
                }


                /* -----------------------------------------
                   CHECK EMAIL DUPLICATE
                ----------------------------------------- */

                db.query(
                    `
                    SELECT id
                    FROM officers
                    WHERE email = ?
                    AND id != ?
                    `,
                    [
                        cleanEmail,
                        id
                    ],
                    (emailErr, emailRows) => {

                        if (emailErr) {

                            console.error(
                                "Officer email check error:",
                                emailErr
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Database error while checking email"
                            });
                        }


                        if (
                            emailRows &&
                            emailRows.length > 0
                        ) {

                            return res.status(400).json({
                                success: false,
                                message:
                                    "Email already belongs to another officer."
                            });
                        }


                        /* ---------------------------------
                           GET DEPARTMENT
                        --------------------------------- */

                        if (
                            officerType === "municipal"
                        ) {

                            executeOfficerUpdate(
                                null
                            );

                            return;
                        }


                        db.query(
                            `
                            SELECT
                                id,
                                department_name
                            FROM departments
                            WHERE id = ?
                            `,
                            [finalDepartmentId],
                            (deptErr, deptRows) => {

                                if (deptErr) {

                                    console.error(
                                        "Department lookup error:",
                                        deptErr
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            "Failed to verify department"
                                    });
                                }


                                if (
                                    !deptRows ||
                                    deptRows.length === 0
                                ) {

                                    return res.status(404).json({
                                        success: false,
                                        message:
                                            "Selected department was not found"
                                    });
                                }


                                executeOfficerUpdate(
                                    deptRows[0]
                                        .department_name
                                );
                            }
                        );
                    }
                );


                /* =============================================
                   EXECUTE UPDATE
                ============================================= */

                function executeOfficerUpdate(
                    departmentName
                ) {

                    const updateValuesBase = [
                        cleanName,
                        cleanEmail,
                        departmentName,
                        finalDepartmentId,
                        officerType,
                        finalSubRole
                    ];


                    /* -----------------------------------------
                       UPDATE WITH PASSWORD
                    ----------------------------------------- */

                    if (
                        password &&
                        password.trim() !== ""
                    ) {

                        const isPasswordValid =
                            password.length >= 8 &&
                            /[A-Z]/.test(password) &&
                            /[a-z]/.test(password) &&
                            /[0-9]/.test(password) &&
                            /[@$!%*?&]/.test(password);


                        if (!isPasswordValid) {

                            return res.status(400).json({
                                success: false,
                                message:
                                    "New password must contain at least 8 characters, uppercase, lowercase, number and special character."
                            });
                        }


                        bcrypt.hash(
                            password,
                            10,
                            (hashErr, hashedPassword) => {

                                if (hashErr) {

                                    console.error(
                                        "Password hash error:",
                                        hashErr
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            "Failed to update password"
                                    });
                                }


                                const query = `
                                    UPDATE officers
                                    SET
                                        full_name = ?,
                                        email = ?,
                                        password = ?,
                                        department = ?,
                                        department_id = ?,
                                        officer_type = ?,
                                        sub_role = ?
                                    WHERE id = ?
                                `;


                                const params = [
                                    cleanName,
                                    cleanEmail,
                                    hashedPassword,
                                    departmentName,
                                    finalDepartmentId,
                                    officerType,
                                    finalSubRole,
                                    id
                                ];


                                runUpdate(
                                    query,
                                    params
                                );
                            }
                        );

                        return;
                    }


                    /* -----------------------------------------
                       UPDATE WITHOUT PASSWORD
                    ----------------------------------------- */

                    const query = `
                        UPDATE officers
                        SET
                            full_name = ?,
                            email = ?,
                            department = ?,
                            department_id = ?,
                            officer_type = ?,
                            sub_role = ?
                        WHERE id = ?
                    `;


                    const params = [
                        ...updateValuesBase,
                        id
                    ];


                    runUpdate(
                        query,
                        params
                    );
                }


                /* =============================================
                   RUN DATABASE UPDATE
                ============================================= */

                function runUpdate(
                    query,
                    params
                ) {

                    db.query(
                        query,
                        params,
                        (err, result) => {

                            if (err) {

                                console.error(
                                    "Update officer error:",
                                    err
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Failed to update officer"
                                });
                            }


                            if (
                                result.affectedRows === 0
                            ) {

                                return res.status(404).json({
                                    success: false,
                                    message:
                                        "Officer not found"
                                });
                            }


                            return res.json({
                                success: true,
                                message:
                                    "Officer Updated Successfully"
                            });
                        }
                    );
                }
            }

        } catch (error) {

            console.error(
                "UPDATE OFFICER ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update officer"
            });
        }
    }
);


/* =====================================================
   DELETE OFFICER
===================================================== */

router.delete(
    "/officer/:id",
    (req, res) => {

        const { id } =
            req.params;


        db.query(
            "DELETE FROM officers WHERE id = ?",
            [id],
            (err, result) => {

                if (err) {

                    console.error(
                        "Delete officer error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Failed to delete officer"
                    });
                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Officer not found"
                    });
                }


                return res.json({
                    success: true,
                    message:
                        "Officer Deleted Successfully"
                });
            }
        );
    }
);


/* =====================================================
   ADMIN COMPLAINT STATISTICS
===================================================== */

router.get(
    "/statistics",
    (req, res) => {

        const queries = {

            total: `
                SELECT COUNT(*) AS total
                FROM petitions
            `,

            pending: `
                SELECT COUNT(*) AS pending
                FROM petitions
                WHERE status = 'Pending'
            `,

            resolved: `
                SELECT COUNT(*) AS resolved
                FROM petitions
                WHERE status = 'Resolved'
            `
        };


        db.query(
            queries.total,
            (err, totalResult) => {

                if (err) {

                    console.error(
                        "Total statistics error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Failed to load statistics"
                    });
                }


                db.query(
                    queries.pending,
                    (err, pendingResult) => {

                        if (err) {

                            console.error(
                                "Pending statistics error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Failed to load statistics"
                            });
                        }


                        db.query(
                            queries.resolved,
                            (err, resolvedResult) => {

                                if (err) {

                                    console.error(
                                        "Resolved statistics error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            "Failed to load statistics"
                                    });
                                }


                                return res.json({

                                    success: true,

                                    statistics: {

                                        total:
                                            Number(
                                                totalResult[0]
                                                    .total
                                            ) || 0,

                                        pending:
                                            Number(
                                                pendingResult[0]
                                                    .pending
                                            ) || 0,

                                        resolved:
                                            Number(
                                                resolvedResult[0]
                                                    .resolved
                                            ) || 0
                                    }
                                });
                            }
                        );
                    }
                );
            }
        );
    }
);


/* =====================================================
   VIEW ALL PETITIONS
===================================================== */

router.get(
    "/petitions",
    (req, res) => {

        const query = `
            SELECT
                id,
                citizen_id,
                citizen_name,
                phone,
                city,
                state,
                street,
                area,
                description,
                category,
                status,
                created_at,
                image_path,
                latitude,
                longitude
            FROM petitions
            ORDER BY id DESC
        `;


        db.query(
            query,
            (err, result) => {

                if (err) {

                    console.error(
                        "Admin petitions error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to load petitions"
                    });
                }


                return res.json({
                    success: true,
                    petitions:
                        result || []
                });
            }
        );
    }
);


/* =====================================================
   GET ALL DEPARTMENTS
===================================================== */

router.get(
    "/departments",
    (req, res) => {

        const query = `
            SELECT
                id,
                department_name
            FROM departments
            ORDER BY department_name ASC
        `;


        db.query(
            query,
            (err, result) => {

                if (err) {

                    console.error(
                        "Load Departments Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to load departments"
                    });
                }


                return res.json({
                    success: true,
                    departments:
                        result || []
                });
            }
        );
    }
);


/* =====================================================
   EXPORT
===================================================== */

module.exports = router;