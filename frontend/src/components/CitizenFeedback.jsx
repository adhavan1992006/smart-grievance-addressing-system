import React, { useState, useEffect } from "react";
import axios from "axios";

function CitizenFeedback({ petitionId, citizenId }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [resolutionStatus, setResolutionStatus] = useState("Yes");
  const [comment, setComment] = useState("");
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchFeedback();
  }, [petitionId]);

  const fetchFeedback = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/feedback/${petitionId}`
      );
      if (response.data.success && response.data.feedback) {
        setExistingFeedback(response.data.feedback);
      }
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const response = await axios.post("http://localhost:5000/api/feedback", {
        petition_id: petitionId,
        citizen_id: citizenId,
        rating,
        resolution_status: resolutionStatus,
        comment,
      });

      if (response.data.success) {
        setSuccessMsg("Thank you for your feedback!");
        setExistingFeedback(response.data.feedback);
      } else {
        setErrorMsg(response.data.message || "Failed to submit feedback.");
      }
    } catch (err) {
      console.error("Feedback submit error:", err);
      setErrorMsg(
        err.response?.data?.message || "Failed to submit feedback. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-3 text-muted">
        <span className="spinner-border spinner-border-sm me-2" />
        Checking feedback...
      </div>
    );
  }

  if (existingFeedback) {
    return (
      <div className="gov-card p-4 mt-4 border-start border-4 border-success">
        <h5 className="fw-bold text-dark mb-3">⭐ Citizen Feedback Submitted</h5>
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="fw-semibold">Rating:</span>
          <div>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                style={{
                  fontSize: "20px",
                  color: star <= existingFeedback.rating ? "#F59E0B" : "#CBD5E1",
                }}
              >
                ★
              </span>
            ))}
          </div>
          <span className="ms-2 badge bg-light text-dark border">
            {existingFeedback.rating}/5
          </span>
        </div>

        <div className="mb-2">
          <span className="fw-semibold">Was your issue resolved? </span>
          <span
            className={`badge ms-2 ${
              existingFeedback.resolution_status === "Yes"
                ? "bg-success"
                : existingFeedback.resolution_status === "Partially"
                ? "bg-warning text-dark"
                : "bg-danger"
            }`}
          >
            {existingFeedback.resolution_status}
          </span>
        </div>

        {existingFeedback.comment && (
          <div className="mt-3 p-3 bg-light rounded text-muted">
            <small className="fw-semibold d-block text-secondary mb-1">
              Comments:
            </small>
            "{existingFeedback.comment}"
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="gov-card p-4 mt-4 border-start border-4 border-primary">
      <h5 className="fw-bold text-dark mb-2">🌟 How was your experience?</h5>
      <p className="text-muted small mb-3">
        Your feedback helps improve municipal grievance addressing and officer responsiveness.
      </p>

      {errorMsg && (
        <div className="gov-alert gov-alert-danger mb-3">
          <strong>⚠️ </strong> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="gov-alert gov-alert-success mb-3">
          <strong>✅ </strong> {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Rating Stars */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Satisfaction Rating</label>
          <div className="d-flex gap-1 align-items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                style={{
                  fontSize: "28px",
                  cursor: "pointer",
                  color:
                    star <= (hoverRating || rating) ? "#F59E0B" : "#CBD5E1",
                  transition: "color 0.15s ease-in-out",
                }}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
            <span className="ms-3 fw-bold text-primary">{rating} / 5 Stars</span>
          </div>
        </div>

        {/* Resolution Status */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Was your issue resolved?</label>
          <div className="d-flex gap-3">
            {["Yes", "Partially", "No"].map((opt) => (
              <div key={opt} className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="resolutionStatus"
                  id={`res-${opt}`}
                  value={opt}
                  checked={resolutionStatus === opt}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                />
                <label
                  className="form-check-label fw-medium"
                  htmlFor={`res-${opt}`}
                >
                  {opt}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Comment Box */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Additional Comments (Optional)</label>
          <textarea
            className="form-control"
            rows="3"
            placeholder="Share details about the resolution quality or timeliness..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-main fw-semibold px-4"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </button>
      </form>
    </div>
  );
}

export default CitizenFeedback;
