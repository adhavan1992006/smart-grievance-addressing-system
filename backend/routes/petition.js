const express = require("express");
const db = require("../db");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const { sendPetitionSubmittedEmail } = require("../services/emailService");
const { calculateSlaDeadline } = require("../services/escalationService");
const { detectSpam } = require("../services/spamDetector");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();


// =====================================================
// IMAGE UPLOAD CONFIGURATION
// =====================================================

const uploadFolder = path.join(__dirname, "../uploads");


// Create uploads folder if it does not exist

if (!fs.existsSync(uploadFolder)) {

    fs.mkdirSync(uploadFolder, {
        recursive: true
    });

}


// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, uploadFolder);

    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);

    }

});


// =====================================================
// MULTER CONFIGURATION
// =====================================================

const upload = multer({

    storage: storage,

    limits: {

        fileSize: 5 * 1024 * 1024

    },

    fileFilter: function (req, file, cb) {

        const allowedTypes = [

            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/webp"

        ];

        if (allowedTypes.includes(file.mimetype)) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only JPG, JPEG, PNG and WEBP images are allowed"
                )
            );

        }

    }

});


// =====================================================
// GOOGLE GEOCODING FUNCTION
// =====================================================

async function getCoordinates(
    street,
    area,
    city,
    state
) {

    const apiKey =
        process.env.GOOGLE_MAPS_API_KEY;


    // =================================================
    // CHECK API KEY
    // =================================================

    if (!apiKey) {

        throw new Error(
            "GOOGLE_MAPS_API_KEY is missing in .env"
        );

    }


    // =================================================
    // BUILD LOCATION QUERY
    // =================================================

    const address =
        `${street}, ${area}, ${city}, ${state}, India`;


    console.log(
        "Google Geocoding:",
        address
    );


    // =================================================
    // GOOGLE GEOCODING URL
    // =================================================

    const url =
        "https://maps.googleapis.com/maps/api/geocode/json?" +
        new URLSearchParams({

            address: address,

            key: apiKey,

            region: "in",

            language: "en"

        }).toString();


    // =================================================
    // CALL GOOGLE
    // =================================================

    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            `Google Geocoding HTTP error: ${response.status}`
        );

    }


    const data =
        await response.json();


    console.log(
        "Google Geocoding Status:",
        data.status
    );


    // =================================================
    // GOOGLE API ERROR
    // =================================================

    if (data.status !== "OK") {

        console.log(
            "Google Geocoding Error:",
            data.error_message || "Unknown error"
        );

        throw new Error(
            data.error_message ||
            `Google Geocoding failed: ${data.status}`
        );

    }


    // =================================================
    // FIND BEST RESULT
    // =================================================

    for (const result of data.results) {

        const location =
            result.geometry.location;


        const latitude =
            Number(location.lat);


        const longitude =
            Number(location.lng);


        if (
            Number.isNaN(latitude) ||
            Number.isNaN(longitude)
        ) {

            continue;

        }


        // =================================================
        // MADURAI SAFETY CHECK
        // =================================================

        const insideMadurai =

            latitude >= 9.75 &&
            latitude <= 10.10 &&

            longitude >= 77.95 &&
            longitude <= 78.30;


        if (insideMadurai) {

            console.log(
                "Matched Google Location:",
                result.formatted_address
            );


            console.log(
                "Latitude:",
                latitude
            );


            console.log(
                "Longitude:",
                longitude
            );


            return {

                latitude: latitude,

                longitude: longitude,

                formattedAddress:
                    result.formatted_address

            };

        }

    }


    // =================================================
    // NO VALID MADURAI LOCATION
    // =================================================

    throw new Error(
        "Location was found, but it is outside Madurai"
    );

}


// =====================================================
// SUBMIT PETITION
// =====================================================

router.post(
    "/submit",
    authenticateToken,
    requireRole("citizen"),
    upload.single("image"),
    async (req, res) => {

        // =================================================
        // GET REQUEST DATA
        // =================================================

        const {

            citizen_id,
            citizen_name,
            phone,

            city,
            state,
            street,
            area,

            description

        } = req.body;


        // Verify that authenticated user ID matches citizen_id
        if (String(req.user.id) !== String(citizen_id)) {
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only submit petitions for your own account."
            });
        }


        // =================================================
        // CHECK REQUIRED FIELDS
        // =================================================

        if (
            !citizen_id ||
            !citizen_name ||
            !phone ||
            !city ||
            !state ||
            !street ||
            !area ||
            !description
        ) {

            if (req.file) {

                fs.unlink(
                    req.file.path,
                    () => {}
                );

            }


            return res.status(400).json({

                success: false,

                message:
                    "All location and complaint fields are required"

            });

        }


        // =================================================
        // CLEAN DATA
        // =================================================

        const cleanCity =
            city.trim();

        const cleanState =
            state.trim();

        const cleanStreet =
            street.trim();

        const cleanArea =
            area.trim();

        const cleanDescription =
            description.trim();


        // =================================================
        // MADURAI CHECK
        // =================================================

        if (
            cleanCity.toLowerCase() !==
            "madurai"
        ) {

            if (req.file) {

                fs.unlink(
                    req.file.path,
                    () => {}
                );

            }


            return res.status(400).json({

                success: false,

                message:
                    "Currently complaints are supported only in Madurai"

            });

        }


        // =================================================
        // IMAGE PATH
        // =================================================

        let imagePath = null;


        if (req.file) {

            imagePath =
                "/uploads/" +
                req.file.filename;

        }


        try {

        // =================================================
        // VERIFIED CITIZEN DATA FROM DATABASE
        // =================================================
        let verifiedName = citizen_name;
        let verifiedPhone = phone;

        try {
            const [citizenRows] = await db.promise().query(
                "SELECT full_name, phone FROM citizens WHERE id = ?",
                [req.user.id]
            );
            if (citizenRows && citizenRows.length > 0) {
                if (citizenRows[0].full_name) verifiedName = citizenRows[0].full_name;
                if (citizenRows[0].phone) verifiedPhone = citizenRows[0].phone;
            }
        } catch (dbErr) {
            console.warn("Could not fetch citizen profile, using request data:", dbErr.message);
        }

        // =================================================
        // SMART GEOCODING (PRIORITY #8)
        // Prefer valid coordinates sent by frontend map
        // =================================================
        let latitude = null;
        let longitude = null;

        const inputLat = Number(req.body.latitude);
        const inputLng = Number(req.body.longitude);

        if (
            !Number.isNaN(inputLat) &&
            !Number.isNaN(inputLng) &&
            inputLat >= 9.75 &&
            inputLat <= 10.10 &&
            inputLng >= 77.95 &&
            inputLng <= 78.30
        ) {
            latitude = inputLat;
            longitude = inputLng;
            console.log("Using validated frontend map coordinates:", latitude, longitude);
        } else {
            console.log("Fetching coordinates via backend Google Geocoding...");
            const locationData = await getCoordinates(
                cleanStreet,
                cleanArea,
                cleanCity,
                cleanState
            );
            latitude = locationData.latitude;
            longitude = locationData.longitude;
        }

        // =================================================
        // AI PREDICTION WITH SAFE FALLBACK (PRIORITY #1)
        // Never fail petition submission if AI service is offline
        // =================================================
        let category = "General Civic Issue";
        let confidence = 0;

        try {
            console.log("Requesting AI complaint prediction from http://127.0.0.1:8000/predict ...");
            const aiResponse = await axios.post(
                "http://127.0.0.1:8000/predict",
                {
                    description: cleanDescription
                },
                {
                    timeout: 4000
                }
            );

            if (
                aiResponse &&
                aiResponse.data &&
                aiResponse.data.success &&
                aiResponse.data.category &&
                aiResponse.data.category !== "No Category Detected"
            ) {
                category = aiResponse.data.category;
                confidence = Number(aiResponse.data.confidence) || 0;
                console.log("AI Prediction Succeeded:", category, `(Confidence: ${confidence})`);
            } else {
                console.warn("AI returned low confidence or no category, falling back to General Civic Issue");
            }
        } catch (aiErr) {
            console.warn(
                "⚠️ AI Prediction Service offline/unavailable (" +
                (aiErr.code || aiErr.message) +
                "). Gracefully falling back to General Civic Issue."
            );
            // Safe fallback keeps submission working
            category = "General Civic Issue";
            confidence = 0;
        }

        // =================================================
        // SLA PRIORITY & DEADLINE CALCULATION
        // =================================================
        let priority = "MEDIUM";
        const normCat = (category || "").toLowerCase();
        if (
            normCat.includes("electricity") ||
            normCat.includes("power") ||
            normCat.includes("danger") ||
            normCat.includes("hazard") ||
            normCat.includes("water") ||
            normCat.includes("drainage")
        ) {
            priority = "HIGH";
        } else if (
            normCat.includes("road") ||
            normCat.includes("pothole") ||
            normCat.includes("garbage") ||
            normCat.includes("waste")
        ) {
            priority = "HIGH";
        } else if (
            normCat.includes("street light") ||
            normCat.includes("streetlight")
        ) {
            priority = "MEDIUM";
        } else {
            priority = "MEDIUM";
        }

        const slaDeadline = calculateSlaDeadline(priority, new Date());
        const spamResult = detectSpam(cleanDescription);

        // =================================================
        // AUTO-DETERMINE ASSIGNED DEPARTMENT (PRIORITY #2)
        // Matches exact MySQL departments table values
        // =================================================
        let assignedDept = "General Administration Department";

        if (
            normCat.includes("water supply") ||
            normCat.includes("water problem") ||
            normCat.includes("water") ||
            cleanDescription.toLowerCase().includes("water")
        ) {
            assignedDept = "Water Supply Department";
        } else if (
            normCat.includes("road") ||
            normCat.includes("pothole") ||
            cleanDescription.toLowerCase().includes("pothole") ||
            cleanDescription.toLowerCase().includes("road")
        ) {
            assignedDept = "Roads & Highways Department";
        } else if (
            normCat.includes("street light") ||
            normCat.includes("electricity") ||
            normCat.includes("power") ||
            cleanDescription.toLowerCase().includes("electric") ||
            cleanDescription.toLowerCase().includes("street light")
        ) {
            assignedDept = "Electrical Department";
        } else if (
            normCat.includes("garbage") ||
            normCat.includes("waste") ||
            normCat.includes("dumping") ||
            cleanDescription.toLowerCase().includes("garbage") ||
            cleanDescription.toLowerCase().includes("waste")
        ) {
            assignedDept = "Sanitation Department";
        } else if (
            normCat.includes("drainage") ||
            normCat.includes("sewage") ||
            cleanDescription.toLowerCase().includes("drainage") ||
            cleanDescription.toLowerCase().includes("sewer")
        ) {
            assignedDept = "Drainage & Sewerage Department";
        } else if (
            normCat.includes("toilet") ||
            normCat.includes("sanitation")
        ) {
            assignedDept = "Sanitation Department";
        } else if (
            normCat.includes("tree") ||
            normCat.includes("park") ||
            normCat.includes("animal") ||
            normCat.includes("environment") ||
            cleanDescription.toLowerCase().includes("tree")
        ) {
            assignedDept = "Parks & Environment Department";
        } else if (
            normCat.includes("health") ||
            cleanDescription.toLowerCase().includes("hospital")
        ) {
            assignedDept = "Public Health Department";
        }

        const deptIdMap = {
            "Water Supply Department": 1,
            "Roads & Highways Department": 2,
            "Electrical Department": 3,
            "Sanitation Department": 4,
            "Drainage & Sewerage Department": 5,
            "Public Health Department": 6,
            "Parks & Environment Department": 7,
            "General Administration Department": 8
        };
        const assignedDeptId = deptIdMap[assignedDept] || 8;
        const actualCitizenId = req.user.id;

            // =================================================
            // DATABASE INSERT
            // =================================================

            const query = `
                INSERT INTO petitions
                (
                    citizen_id,
                    citizen_name,
                    phone,

                    city,
                    state,
                    street,
                    area,

                    description,
                    category,
                    priority,
                    sla_deadline,
                    assigned_department,
                    department_id,

                    is_spam,
                    spam_score,
                    spam_reason,

                    image_path,

                    latitude,
                    longitude
                )

                VALUES
                (
                    ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?,
                    ?, ?
                )
            `;


            db.query(

                query,

                [

                    actualCitizenId,
                    verifiedName,
                    verifiedPhone,

                    cleanCity,
                    cleanState,
                    cleanStreet,
                    cleanArea,

                    cleanDescription,
                    category,
                    priority,
                    slaDeadline,
                    assignedDept,
                    assignedDeptId,

                    spamResult.isSpam,
                    spamResult.score,
                    spamResult.reason,

                    imagePath,

                    latitude,
                    longitude

                ],

                (err, result) => {

                    // =================================================
                    // DATABASE ERROR
                    // =================================================

                    if (err) {

                        console.log(
                            "Database Error:",
                            err
                        );


                        // Delete uploaded image

                        if (req.file) {

                            fs.unlink(
                                req.file.path,
                                () => {}
                            );

                        }


                        return res.status(500).json({

                            success: false,

                            message:
                                "Database Error"

                        });

                    }


                    // =================================================
                    // SUCCESS
                    // =================================================

                    console.log(
                        "Petition Saved:",
                        result.insertId
                    );

                    // =================================================
                    // SEND SUBMISSION EMAIL NOTIFICATION
                    // =================================================
                    db.query(
                        "SELECT email FROM citizens WHERE id = ?",
                        [citizen_id],
                        (cErr, cRows) => {
                            if (!cErr && cRows && cRows.length > 0 && cRows[0].email) {
                                const citizenEmail = cRows[0].email;
                                const locationStr = `${cleanStreet}, ${cleanArea}, ${cleanCity}`;
                                sendPetitionSubmittedEmail(
                                    citizenEmail,
                                    citizen_name,
                                    result.insertId,
                                    category,
                                    locationStr
                                ).catch((e) => console.error("Submission email error:", e.message));
                            }
                        }
                    );


                    return res.json({

                        success: true,

                        message:
                            "Petition Submitted Successfully",

                        petition_id:
                            result.insertId,

                        category:
                            category,

                        priority:
                            priority,

                        sla_deadline:
                            slaDeadline,

                        image:
                            imagePath,

                        city:
                            cleanCity,

                        state:
                            cleanState,

                        street:
                            cleanStreet,

                        area:
                            cleanArea,

                        latitude:
                            latitude,

                        longitude:
                            longitude

                    });

                }

            );


        } catch (error) {

            // =================================================
            // ERROR
            // =================================================

            console.log(
                "Petition Processing Error:",
                error
            );


            // =================================================
            // DELETE IMAGE IF SOMETHING FAILED
            // =================================================

            if (req.file) {

                fs.unlink(
                    req.file.path,
                    () => {}
                );

            }


            // =================================================
            // LOCATION ERROR
            // =================================================

            if (
                error.message &&
                (
                    error.message.includes(
                        "Geocoding"
                    ) ||
                    error.message.includes(
                        "Location"
                    ) ||
                    error.message.includes(
                        "Madurai"
                    ) ||
                    error.message.includes(
                        "GOOGLE_MAPS_API_KEY"
                    )
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Location could not be identified. Please check the street name and area."

                });

            }


            // =================================================
            // GENERAL ERROR
            // =================================================

            return res.status(500).json({

                success: false,

                message:
                    "Petition submission failed"

            });

        }

    }

);


// =====================================================
// GET CITIZEN PETITIONS
// =====================================================

router.get("/my-petitions/:citizen_id", authenticateToken, requireRole("citizen"), (req, res) => {

    const { citizen_id } = req.params;

    if (!citizen_id) {

        return res.status(400).json({
            success: false,
            message: "Citizen ID is required"
        });

    }

    if (String(req.user.id) !== String(citizen_id)) {
        return res.status(403).json({
            success: false,
            message: "Access denied. You can only view your own petitions."
        });
    }

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
            priority,
            sla_deadline,
            escalated,
            escalated_at,
            escalation_reason,
            image_path,
            latitude,
            longitude,
            created_at
        FROM petitions
        WHERE citizen_id = ?
        ORDER BY created_at DESC
    `;

    db.query(
        query,
        [citizen_id],
        (err, results) => {

            if (err) {

                console.log(
                    "Fetch Citizen Petitions Error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to fetch petitions"
                });

            }

            return res.json({

                success: true,

                petitions: results

            });

        }
    );

});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;