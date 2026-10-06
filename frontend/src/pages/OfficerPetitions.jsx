import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function OfficerPetitions() {
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const category = searchParams.get("category");
  const area = searchParams.get("area");
  const filter = searchParams.get("filter");

  useEffect(() => {
    const fetchPetitions = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        let url;

        if (filter === "escalated") {
          url = "https://smart-grievance-backend-b6ow.onrender.com/api/officer/petitions-escalated";
        } else if (category) {
          url = `https://smart-grievance-backend-b6ow.onrender.com/api/officer/petitions/${encodeURIComponent(
            category
          )}`;
        } else if (area) {
          url = `https://smart-grievance-backend-b6ow.onrender.com/api/officer/petitions/area/${encodeURIComponent(
            area
          )}`;
        } else {
          url = "https://smart-grievance-backend-b6ow.onrender.com/api/officer/petitions";
        }

        const response = await axios.get(url);

        if (response.data.success) {
          setPetitions(response.data.petitions || []);
        } else {
          setPetitions([]);
          setErrorMsg("Failed to load petitions.");
        }
      } catch (error) {
        console.error("Error loading petitions:", error);
        setErrorMsg(
          "Failed to load petitions from server. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPetitions();
  }, [category, area, filter]);

  // SLA Badge
  const getSlaBadge = (petition) => {
    if (
      petition.status === "Resolved" ||
      petition.status === "Rejected"
    ) {
      return (
        <span className="badge bg-light text-muted border">
          Completed
        </span>
      );
    }

    if (!petition.sla_deadline) {
      return (
        <span className="badge bg-light text-dark border">
          Standard
        </span>
      );
    }

    const deadline = new Date(petition.sla_deadline).getTime();
    const now = new Date().getTime();

    if (now > deadline || petition.escalated === 1) {
      return (
        <span className="badge bg-danger">
          🔴 OVERDUE
        </span>
      );
    }

    const hoursRemaining =
      (deadline - now) / (1000 * 60 * 60);

    if (hoursRemaining <= 24) {
      return (
        <span className="badge bg-warning text-dark">
          🟠 DUE TODAY
        </span>
      );
    }

    return (
      <span className="badge bg-success">
        🟢 WITHIN SLA
      </span>
    );
  };

  // Page title
  let pageTitle = "All Grievance Petitions";
  let pageDescription =
    "Complaints arranged sequentially from latest to oldest.";

  if (filter === "escalated") {
    pageTitle = "Escalated & Overdue Grievances";
    pageDescription =
      "Showing high-priority breached complaints requiring immediate escalation.";
  } else if (category) {
    pageTitle = `${category} Grievances`;
    pageDescription = `Filtered view: Showing only grievances categorized under "${category}".`;
  } else if (area) {
    pageTitle = `${area} Grievances`;
    pageDescription = `Filtered view: Showing only grievances reported in "${area}".`;
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-content">
        <div className="container">

          {/* ================= HEADER ================= */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <div className="d-flex align-items-center gap-2">
                <h2 className="fw-bold text-dark mb-0">
                  {pageTitle}
                </h2>

                {(category || area || filter) && (
                  <button
                    className="btn btn-sm btn-outline-secondary ms-2"
                    onClick={() => navigate("/officer-petitions")}
                  >
                    Clear Filter ✕
                  </button>
                )}
              </div>

              <p className="text-muted mb-0">
                {pageDescription}
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary fw-semibold px-3"
                onClick={() => navigate("/officer-dashboard")}
              >
                ← Dashboard
              </button>
            </div>
          </div>

          {/* ================= ERROR ================= */}
          {errorMsg && (
            <div className="gov-alert gov-alert-danger mb-4">
              <strong>⚠️ Error: </strong>
              {errorMsg}
            </div>
          )}

          {/* ================= LOADING ================= */}
          {loading && (
            <div className="text-center py-5">
              <div
                className="spinner-border text-primary"
                role="status"
              />

              <p className="mt-3 text-muted">
                Loading petitions data...
              </p>
            </div>
          )}

          {/* ================= MAIN TABLE ================= */}
          {!loading && (
            <div className="gov-card overflow-hidden mb-5">

              {/* Table Header */}
              <div
                className="p-3 text-white d-flex justify-content-between align-items-center"
                style={{
                  background: "#1E3A8A",
                }}
              >
                <h5 className="mb-0 fw-bold">
                  {filter === "escalated"
                    ? "Escalated Grievances"
                    : category
                    ? `${category} Complaints`
                    : area
                    ? `${area} Complaints`
                    : "Grievance Records"}
                </h5>

                <span className="badge bg-light text-primary fw-bold">
                  {petitions.length} Records Found
                </span>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table gov-table table-hover mb-0">

                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Citizen Name</th>
                      <th>Category</th>
                      <th>Area / Street</th>
                      <th>SLA Status</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {petitions.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-5 text-muted"
                        >
                          <div
                            style={{
                              fontSize: "40px",
                            }}
                          >
                            📭
                          </div>

                          <p className="mt-2 mb-0">
                            No petitions found for this criteria.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      petitions.map((petition) => (
                        <tr
                          key={petition.id}
                          className={
                            petition.is_spam
                              ? "table-warning"
                              : ""
                          }
                        >

                          {/* ================= ID ================= */}
                          <td>
                            <strong>
                              #{petition.id}
                            </strong>

                            {petition.is_spam === 1 && (
                              <span
                                className="badge bg-danger ms-1"
                                title={
                                  petition.spam_reason ||
                                  "Suspicious complaint"
                                }
                              >
                                ⚠️ Spam
                              </span>
                            )}
                          </td>

                          {/* ================= CITIZEN ================= */}
                          <td>
                            <div className="fw-semibold text-dark">
                              {petition.citizen_name ||
                                "Citizen"}
                            </div>

                            {petition.phone && (
                              <small className="text-muted">
                                {petition.phone}
                              </small>
                            )}
                          </td>

                          {/* ================= CATEGORY ================= */}
                          <td>
                            <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 px-2 py-1">
                              {petition.category ||
                                "General"}
                            </span>
                          </td>

                          {/* ================= AREA ================= */}
                          <td>
                            <div className="fw-semibold text-dark">
                              {petition.area || "-"}
                            </div>

                            {petition.street && (
                              <small className="text-muted">
                                {petition.street}
                              </small>
                            )}
                          </td>

                          {/* ================= SLA STATUS ================= */}
                          <td>
                            {getSlaBadge(petition)}
                          </td>

                          {/* ================= STATUS ================= */}
                          <td>
                            <span
                              className={`badge px-2 py-1 ${
                                petition.status ===
                                "Resolved"
                                  ? "bg-success"
                                  : petition.status ===
                                    "In Progress"
                                  ? "bg-primary"
                                  : petition.status ===
                                    "Rejected"
                                  ? "bg-danger"
                                  : "bg-warning text-dark"
                              }`}
                            >
                              {petition.status ||
                                "Pending"}
                            </span>
                          </td>

                          {/* ================= ACTION ================= */}
                          <td>
                            <button
                              className="btn btn-sm btn-primary fw-semibold px-3"
                              onClick={() =>
                                navigate(
                                  `/petition/${petition.id}`
                                )
                              }
                            >
                              Details →
                            </button>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>

                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default OfficerPetitions;