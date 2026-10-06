import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { clearStaleTokens } from "../utils/axiosConfig";

function CitizenDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("citizenUser") || "{}");

  const logout = () => {
    clearStaleTokens();
    navigate("/citizen-login");
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-content">
        <div className="container">
          {/* Welcome Banner */}
          <div
            className="card border-0 shadow-sm mb-4 text-white p-4"
            style={{
              background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
              borderRadius: "16px",
            }}
          >
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <span className="badge bg-light text-primary fw-bold mb-2 px-3 py-1">
                  Citizen Portal
                </span>
                <h2 className="fw-bold mb-1">Welcome, {user?.full_name || "Citizen"}! 👋</h2>
                <p className="mb-0 text-white-50">
                  Manage your civic grievances, track redressal status in real-time, or submit a new petition.
                </p>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-light text-primary fw-semibold px-4"
                  onClick={() => navigate("/submit-petition")}
                >
                  ➕ New Grievance
                </button>
              </div>
            </div>

            {/* Quick Citizen Details Bar */}
            <div
              className="mt-4 pt-3 d-flex flex-wrap gap-4 border-top border-white border-opacity-25 small"
            >
              <div>
                <span className="text-white-50">Email: </span>
                <strong>{user?.email || "N/A"}</strong>
              </div>
              <div>
                <span className="text-white-50">Phone: </span>
                <strong>{user?.phone || "N/A"}</strong>
              </div>
              {user?.city && (
                <div>
                  <span className="text-white-50">City: </span>
                  <strong>{user.city}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Action Cards */}
          <div className="row g-4 mb-4">
            {/* SUBMIT PETITION */}
            <div className="col-md-4">
              <div
                className="gov-card h-100 p-4 d-flex flex-column text-center align-items-center"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/submit-petition")}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: "70px",
                    height: "70px",
                    background: "#EFF6FF",
                    fontSize: "32px",
                  }}
                >
                  📝
                </div>
                <h4 className="fw-bold text-dark mb-2">Submit Grievance</h4>
                <p className="text-muted small flex-grow-1">
                  Report issues such as damaged roads, broken streetlights, water supply faults, or drainage blockages with location pin & photo.
                </p>
                <button className="btn-main w-100 mt-3">
                  Submit Petition →
                </button>
              </div>
            </div>

            {/* TRACK PETITION */}
            <div className="col-md-4">
              <div
                className="gov-card h-100 p-4 d-flex flex-column text-center align-items-center"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/track-petition")}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: "70px",
                    height: "70px",
                    background: "#F0FDF4",
                    fontSize: "32px",
                  }}
                >
                  📍
                </div>
                <h4 className="fw-bold text-dark mb-2">Track Petitions</h4>
                <p className="text-muted small flex-grow-1">
                  Monitor the real-time status of your submitted petitions across review, inspection, progress, and resolution stages.
                </p>
                <button
                  className="btn btn-outline-primary w-100 mt-3 fw-semibold"
                  style={{ borderRadius: "10px", padding: "10px 18px" }}
                >
                  View Status →
                </button>
              </div>
            </div>

            {/* LOGOUT / ACCOUNT */}
            <div className="col-md-4">
              <div
                className="gov-card h-100 p-4 d-flex flex-column text-center align-items-center"
                style={{ cursor: "pointer" }}
                onClick={logout}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: "70px",
                    height: "70px",
                    background: "#FEF2F2",
                    fontSize: "32px",
                  }}
                >
                  🚪
                </div>
                <h4 className="fw-bold text-dark mb-2">Account Logout</h4>
                <p className="text-muted small flex-grow-1">
                  Safely sign out of your citizen account session. You can sign back in anytime using your registered email and password.
                </p>
                <button
                  className="btn btn-outline-danger w-100 mt-3 fw-semibold"
                  style={{ borderRadius: "10px", padding: "10px 18px" }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Grievance Redressal Guidance */}
          <div className="gov-card p-4">
            <h5 className="fw-bold mb-3 text-dark">📌 Tips for Faster Grievance Redressal</h5>
            <div className="row g-3 small text-muted">
              <div className="col-md-4">
                <div className="d-flex align-items-start gap-2">
                  <span className="text-primary fw-bold">1.</span>
                  <span><strong>Accurate Location:</strong> Select the exact landmark or street on Google Maps for officer dispatch.</span>
                </div>
              </div>
              <div className="col-md-4">
                <div className="d-flex align-items-start gap-2">
                  <span className="text-primary fw-bold">2.</span>
                  <span><strong>Clear Description:</strong> Specify the exact issue nature, severity, and duration of the problem.</span>
                </div>
              </div>
              <div className="col-md-4">
                <div className="d-flex align-items-start gap-2">
                  <span className="text-primary fw-bold">3.</span>
                  <span><strong>Upload Photo:</strong> Attaching a clear photograph helps automatic AI categorization and rapid review.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default CitizenDashboard;