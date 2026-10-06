import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function OfficerAreaPriority() {
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAreaPriority = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/officer/area-priority"
        );

        if (response.data.success) {
          setPriorities(response.data.priorities || []);
        }
      } catch (error) {
        console.error("Area priority error:", error);
        setErrorMsg("Failed to load area priorities. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAreaPriority();
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
              <h2 className="fw-bold text-dark mb-1">📍 Priority by Area / Ward</h2>
              <p className="text-muted mb-0">
                Municipal areas and localities ranked according to the total volume of complaints received.
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
            <span style={{ fontSize: "24px" }}>🗺️</span>
            <div className="small text-muted">
              <strong>Zonal Area Allocation:</strong> Identify urban pockets with acute service breakdowns to direct specialized municipal maintenance teams effectively.
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="mt-3 text-muted">Aggregating zonal statistics...</p>
            </div>
          )}

          {/* Zonal Complaint Density Chart */}
          {!loading && priorities.length > 0 && (
            <div className="gov-card p-4 mb-4">
              <h5 className="fw-bold text-dark mb-1">📊 Zonal Grievance Distribution Chart</h5>
              <p className="text-muted small mb-4">
                Visualizing top complaint volume localities in Madurai.
              </p>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priorities.slice(0, 10)}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="area" interval={0} angle={-15} textAnchor="end" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="occurrence" fill="#2563EB" name="Complaints" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Area Priority Table Card */}
          {!loading && (
            <div className="gov-card overflow-hidden mb-5">
              <div
                className="p-3 text-white d-flex justify-content-between align-items-center"
                style={{ background: "#1E3A8A" }}
              >
                <h5 className="mb-0 fw-bold">Zonal Complaint Density Ranking</h5>
                <span className="badge bg-light text-primary fw-bold">
                  {priorities.length} Areas Evaluated
                </span>
              </div>

              <div className="table-responsive">
                <table className="table gov-table table-hover mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>Rank</th>
                      <th>Area / Locality</th>
                      <th>Complaints Count</th>
                      <th>Priority Level</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {priorities.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5 text-muted">
                          <div style={{ fontSize: "40px" }}>📍</div>
                          <p className="mt-2 mb-0">No area-specific complaints found.</p>
                        </td>
                      </tr>
                    ) : (
                      priorities.map((item, index) => (
                        <tr key={item.area}>
                          {/* Rank */}
                          <td>
                            <strong className="fs-6">#{index + 1}</strong>
                          </td>

                          {/* Area */}
                          <td>
                            <strong className="text-dark fs-6">{item.area}</strong>
                          </td>

                          {/* Complaints Count */}
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
                                  `/officer-petitions?area=${encodeURIComponent(
                                    item.area
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

export default OfficerAreaPriority;