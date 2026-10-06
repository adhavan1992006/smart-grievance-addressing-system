import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function TrackPetition() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("citizenUser") || "{}");

  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) {
      navigate("/citizen-login");
      return;
    }

    axios
      .get(`http://localhost:5000/api/petition/my-petitions/${user.id}`)
      .then((response) => {
        if (response.data.success) {
          setPetitions(response.data.petitions || []);
        } else {
          setError(response.data.message || "Unable to load petitions");
        }
      })
      .catch((err) => {
        console.error("Track petitions fetch error:", err);
        setError(
          err.response?.data?.message || "Unable to connect to server. Please try again later."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.id, navigate]);

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "pending":
        return <span className="badge bg-warning text-dark px-3 py-2">⏳ Pending Review</span>;
      case "under review":
        return <span className="badge bg-info text-dark px-3 py-2">🔍 Under Review</span>;
      case "in progress":
        return <span className="badge bg-primary px-3 py-2">🔧 In Progress</span>;
      case "resolved":
        return <span className="badge bg-success px-3 py-2">✅ Resolved</span>;
      case "rejected":
        return <span className="badge bg-danger px-3 py-2">❌ Rejected</span>;
      default:
        return <span className="badge bg-secondary px-3 py-2">{status || "Submitted"}</span>;
    }
  };

  const getStatusStep = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return 1;
      case "under review":
        return 2;
      case "in progress":
        return 3;
      case "resolved":
        return 4;
      default:
        return 1;
    }
  };

  const getNextMessage = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "Your complaint has been logged and queued for initial departmental review.";
      case "under review":
        return "The department officer is inspecting your grievance details and scheduling field response.";
      case "in progress":
        return "The responsible department is actively working on your complaint. You will be notified when the status changes.";
      case "resolved":
        return "Your grievance has been successfully addressed and resolved. Thank you for helping keep our city clean and safe!";
      case "rejected":
        return "This petition was reviewed and closed by municipal authorities.";
      default:
        return "Your petition is being processed by the municipal authority.";
    }
  };

  const getSlaBadge = (petition) => {
    if (petition.status === "Resolved" || petition.status === "Rejected") {
      return null;
    }

    if (!petition.sla_deadline) return null;

    const deadline = new Date(petition.sla_deadline).getTime();
    const now = new Date().getTime();

    if (now > deadline || petition.escalated === 1) {
      return <span className="badge bg-danger ms-2">🔴 OVERDUE</span>;
    }

    const hoursRemaining = (deadline - now) / (1000 * 60 * 60);
    if (hoursRemaining <= 24) {
      return <span className="badge bg-warning text-dark ms-2">🟠 DUE TODAY</span>;
    }

    return <span className="badge bg-success ms-2">🟢 WITHIN SLA</span>;
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-content">
        <div className="container">
          {/* Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h2 className="fw-bold text-dark mb-1">📍 Track My Petitions</h2>
              <p className="text-muted mb-0">
                Real-time tracking and vertical progression timeline for all your civic grievances.
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary fw-semibold px-3"
                onClick={() => navigate("/citizen-dashboard")}
              >
                ← Dashboard
              </button>
              <button
                className="btn-main px-3 py-2"
                onClick={() => navigate("/submit-petition")}
              >
                ➕ New Petition
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-3 text-muted">Retrieving your petitions history...</p>
            </div>
          )}

          {/* Error Alert */}
          {error && !loading && (
            <div className="gov-alert gov-alert-danger mb-4">
              <strong>⚠️ Error: </strong> {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && petitions.length === 0 && (
            <div className="gov-card p-5 text-center my-4">
              <div style={{ fontSize: "60px" }}>📭</div>
              <h4 className="fw-bold text-dark mt-3">No Grievances Found</h4>
              <p className="text-muted mb-4">
                You haven't submitted any complaints yet. If you are experiencing civic issues, report them now.
              </p>
              <button
                className="btn-main px-4 py-2"
                onClick={() => navigate("/submit-petition")}
              >
                Submit Your First Petition →
              </button>
            </div>
          )}

          {/* Petition Cards */}
          {!loading &&
            petitions.map((petition) => {
              const currentStep = getStatusStep(petition.status);
              const isRejected = petition.status?.toLowerCase() === "rejected";

              const steps = [
                { title: "Complaint Submitted", stepNum: 1 },
                { title: "Under Review", stepNum: 2 },
                { title: "In Progress", stepNum: 3 },
                { title: "Resolved", stepNum: 4 },
              ];

              return (
                <div className="gov-card p-4 mb-4" key={petition.id}>
                  {/* Top Bar */}
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3 pb-3 border-bottom">
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h4 className="fw-bold text-dark mb-0">
                          Petition #{petition.id}
                        </h4>
                        {petition.category && (
                          <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 px-2 py-1">
                            {petition.category}
                          </span>
                        )}
                        {getSlaBadge(petition)}
                      </div>
                      <small className="text-muted">
                        Submitted on: {new Date(petition.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </small>
                    </div>
                    <div>{getStatusBadge(petition.status)}</div>
                  </div>

                  {/* Grievance Summary */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100">
                        <small className="text-muted d-block fw-bold mb-1">📍 LOCATION</small>
                        <p className="mb-0 text-dark fw-semibold">
                          {petition.street ? `${petition.street}, ` : ""}
                          {petition.area ? `${petition.area}, ` : ""}
                          {petition.city || "Madurai"}
                        </p>
                      </div>
                    </div>

                    <div className="col-md-8">
                      <div className="p-3 bg-light rounded-3 h-100">
                        <small className="text-muted d-block fw-bold mb-1">📝 GRIEVANCE DETAILS</small>
                        <p className="mb-0 text-dark" style={{ whiteSpace: "pre-wrap" }}>
                          {petition.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vertical Timeline & What Happens Next */}
                  {!isRejected ? (
                    <div className="p-4 bg-light rounded-3 mb-4">
                      <h6 className="fw-bold text-dark mb-3">📌 Grievance Redressal Timeline</h6>

                      <div className="d-flex flex-column gap-3 ms-2 ps-3 border-start border-3 border-primary">
                        {steps.map((s) => {
                          const isCompleted = currentStep > s.stepNum || (currentStep === 4 && s.stepNum === 4);
                          const isActive = currentStep === s.stepNum && currentStep !== 4;
                          const isFuture = currentStep < s.stepNum;

                          return (
                            <div key={s.stepNum} className="d-flex align-items-center gap-3">
                              <div style={{ fontSize: "20px", width: "24px", textAlign: "center" }}>
                                {isCompleted ? (
                                  <span className="text-success fw-bold">✓</span>
                                ) : isActive ? (
                                  <span className="text-primary fw-bold">●</span>
                                ) : (
                                  <span className="text-muted opacity-50">○</span>
                                )}
                              </div>

                              <span
                                className={`fw-semibold ${
                                  isCompleted
                                    ? "text-success"
                                    : isActive
                                    ? "text-primary fs-6"
                                    : "text-muted"
                                }`}
                              >
                                {s.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 p-3 bg-white rounded border border-primary border-opacity-25">
                        <small className="fw-bold text-primary text-uppercase d-block mb-1">
                          Current Status: {petition.status?.toUpperCase() || "PENDING"}
                        </small>
                        <div className="fw-semibold text-dark">
                          What happens next:
                        </div>
                        <p className="text-muted mb-0 small mt-1">
                          "{getNextMessage(petition.status)}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="gov-alert gov-alert-danger mb-4">
                      ❌ <strong>Petition Closed:</strong> This petition has been reviewed and rejected/closed by municipal authorities.
                    </div>
                  )}

                  {/* Action Link */}
                  <div className="d-flex justify-content-end">
                    <button
                      className="btn btn-outline-primary btn-sm fw-semibold px-3"
                      onClick={() => navigate(`/petition/${petition.id}`)}
                    >
                      View Full Details & Status Log →
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default TrackPetition;