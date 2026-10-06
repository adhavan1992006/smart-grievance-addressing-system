import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function OfficerProblemPriority() {
  const navigate = useNavigate();

  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchPriorities = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/officer/priority");

        if (response.data.success) {
          setPriorities(response.data.priorities || []);
        }
      } catch (error) {
        console.error("Priority loading error:", error);
        setErrorMsg("Failed to load problem priorities. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPriorities();
  }, []);

  const getPriority = (index) => {
    if (index === 0) {
      return <span className="badge bg-danger px-3 py-2">🔥 HIGHEST</span>;
    }
    if (index === 1) {
      return <span className="badge bg-warning text-dark px-3 py-2">⚡ HIGH</span>;
    }
    if (index === 2) {
      return <span className="badge bg-info text-dark px-3 py-2">📌 MEDIUM</span>;
    }
    return <span className="badge bg-success px-3 py-2">🟢 LOW</span>;
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-content">
        <div className="container">
          {/* Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h2 className="fw-bold text-dark mb-1">📊 Prioritization by Problem</h2>
              <p className="text-muted mb-0">
                AI categorizations aggregated and ranked according to maximum grievance occurrence.
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

          {/* Inline Error */}
          {errorMsg && (
            <div className="gov-alert gov-alert-danger mb-4">
              <strong>⚠️ Error: </strong> {errorMsg}
            </div>
          )}

          {/* Explanation Alert */}
          <div className="gov-card p-3 mb-4 bg-light border-0 d-flex align-items-center gap-3">
            <span style={{ fontSize: "24px" }}>💡</span>
            <div className="small text-muted">
              <strong>How Prioritization Works:</strong> Civic issues reported most frequently across the city receive highest priority to optimize rapid response team deployment.
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="mt-3 text-muted">Analyzing grievance priorities...</p>
            </div>
          )}

          {/* Priority Table Card */}
          {!loading && (
            <div className="gov-card overflow-hidden mb-5">
              <div
                className="p-3 text-white d-flex justify-content-between align-items-center"
                style={{ background: "#1E3A8A" }}
              >
                <h5 className="mb-0 fw-bold">Problem Severity & Occurrence Matrix</h5>
                <span className="badge bg-light text-primary fw-bold">
                  {priorities.length} Categories Analyzed
                </span>
              </div>

              <div className="table-responsive">
                <table className="table gov-table table-hover mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>Rank</th>
                      <th>Problem Category</th>
                      <th>Occurrence Count</th>
                      <th>Priority Level</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {priorities.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5 text-muted">
                          <div style={{ fontSize: "40px" }}>📊</div>
                          <p className="mt-2 mb-0">No categorized complaints found.</p>
                        </td>
                      </tr>
                    ) : (
                      priorities.map((item, index) => (
                        <tr key={item.category}>
                          {/* Rank */}
                          <td>
                            <strong className="fs-6">#{index + 1}</strong>
                          </td>

                          {/* Problem */}
                          <td>
                            <strong className="text-dark fs-6">{item.category}</strong>
                          </td>

                          {/* Occurrence */}
                          <td>
                            <span className="badge bg-primary px-3 py-2 fs-6">
                              {item.occurrence} Grievances
                            </span>
                          </td>

                          {/* Priority */}
                          <td>{getPriority(index)}</td>

                          {/* Action */}
                          <td>
                            <button
                              className="btn btn-sm btn-primary fw-semibold px-3"
                              onClick={() =>
                                navigate(
                                  `/officer-petitions?category=${encodeURIComponent(
                                    item.category
                                  )}`
                                )
                              }
                            >
                              View Petitions →
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

export default OfficerProblemPriority;