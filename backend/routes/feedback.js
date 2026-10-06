const express = require("express");
const db = require("../db");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

/**
 * =====================================================
 * SUBMIT CITIZEN FEEDBACK
 * POST /api/feedback
 * =====================================================
 */
router.post("/", authenticateToken, requireRole("citizen"), async (req, res) => {
  try {
    const { petition_id, citizen_id, rating, resolution_status, comment } = req.body;

    // Verify token ownership
    if (String(req.user.id) !== String(citizen_id)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only submit feedback under your own account.",
      });
    }

    // 1. Basic validation
    if (!petition_id || !citizen_id || rating === undefined || !resolution_status) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: petition_id, citizen_id, rating, and resolution_status.",
      });
    }

    const numericRating = parseInt(rating, 10);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5 stars.",
      });
    }

    const validResolutionStatuses = ["Yes", "Partially", "No"];
    const formattedResolutionStatus =
      validResolutionStatuses.find(
        (s) => s.toLowerCase() === String(resolution_status).trim().toLowerCase()
      );

    if (!formattedResolutionStatus) {
      return res.status(400).json({
        success: false,
        message: "Resolution confirmation must be 'Yes', 'Partially', or 'No'.",
      });
    }

    // 2. Check if citizen exists
    const [citizenRows] = await db.promise().query(
      "SELECT id FROM citizens WHERE id = ?",
      [citizen_id]
    );

    if (!citizenRows || citizenRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Citizen account not found.",
      });
    }

    // 3. Check if petition exists and belongs to citizen
    const [petitionRows] = await db.promise().query(
      "SELECT id, citizen_id, status FROM petitions WHERE id = ?",
      [petition_id]
    );

    if (!petitionRows || petitionRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Petition not found.",
      });
    }

    const petition = petitionRows[0];

    if (String(petition.citizen_id) !== String(citizen_id)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only submit feedback for your own petition.",
      });
    }

    // 4. Check if petition status is RESOLVED
    if (!petition.status || petition.status.toLowerCase() !== "resolved") {
      return res.status(400).json({
        success: false,
        message: "Feedback can only be provided after a petition has been marked as Resolved.",
      });
    }

    // 5. Check if feedback already exists
    const [existingFeedback] = await db.promise().query(
      "SELECT id FROM feedback WHERE petition_id = ? AND citizen_id = ?",
      [petition_id, citizen_id]
    );

    if (existingFeedback && existingFeedback.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Feedback already submitted for this petition.",
      });
    }

    // 6. Insert feedback record
    const insertQuery = `
      INSERT INTO feedback (petition_id, citizen_id, rating, resolution_status, comment)
      VALUES (?, ?, ?, ?, ?);
    `;

    await db.promise().query(insertQuery, [
      petition_id,
      citizen_id,
      numericRating,
      formattedResolutionStatus,
      comment ? comment.trim() : null,
    ]);

    return res.status(201).json({
      success: true,
      message: "Thank you! Your feedback has been submitted successfully.",
    });
  } catch (error) {
    console.error("❌ Feedback submission error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit feedback due to a server error. Please try again.",
    });
  }
});

/**
 * =====================================================
 * GET FEEDBACK FOR A PETITION
 * GET /api/feedback/:petition_id
 * =====================================================
 */
router.get("/:petition_id", authenticateToken, async (req, res) => {
  try {
    const { petition_id } = req.params;

    if (!petition_id) {
      return res.status(400).json({
        success: false,
        message: "Petition ID is required.",
      });
    }

    const [rows] = await db.promise().query(
      `SELECT id, petition_id, citizen_id, rating, resolution_status, comment, created_at
       FROM feedback 
       WHERE petition_id = ?`,
      [petition_id]
    );

    if (!rows || rows.length === 0) {
      return res.json({
        success: true,
        feedback: null,
      });
    }

    return res.json({
      success: true,
      feedback: rows[0],
    });
  } catch (error) {
    console.error("❌ Fetch feedback error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load feedback details.",
    });
  }
});

module.exports = router;
