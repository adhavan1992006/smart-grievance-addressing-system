import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { validateToken, clearStaleTokens } from "../utils/axiosConfig";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";

  const [citizenUser, setCitizenUser] = useState(null);
  const [officerUser, setOfficerUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    try {
      setCitizenUser(null);
      setOfficerUser(null);
      setAdminUser(null);

      const isCitizen = validateToken("citizenToken", "citizen");
      const cUser = sessionStorage.getItem("citizenUser");
      if (isCitizen && cUser) {
        setCitizenUser(JSON.parse(cUser));
        return;
      }

      const isOfficer = validateToken("officerToken", "officer");
      const oUser = sessionStorage.getItem("officer");
      if (isOfficer && oUser) {
        setOfficerUser(JSON.parse(oUser));
        return;
      }

      const isAdmin = validateToken("adminToken", "admin");
      const aUser = sessionStorage.getItem("admin");
      if (isAdmin && aUser) {
        setAdminUser(true);
        return;
      }
    } catch {
      // Ignore parse errors
    }
  }, [location.pathname]);

  const handleCitizenLogout = () => {
    clearStaleTokens();
    setCitizenUser(null);
    setOfficerUser(null);
    setAdminUser(null);
    navigate("/citizen-login");
  };

  return (
    <nav className="navbar navbar-expand-lg fixed-top gov-navbar shadow-sm py-2">
      <div className="container">
        {/* =========================
            BRAND & LOGO
        ========================= */}
        <Link className="navbar-brand fw-bold" to="/">
          <span
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "18px",
              boxShadow: "0 2px 8px rgba(30, 58, 138, 0.25)"
            }}
          >
            🏛️
          </span>
          <div className="d-flex flex-column lh-1">
            <span style={{ fontSize: "1.15rem", color: "#1E3A8A", fontWeight: 800 }}>
              Smart Grievance
            </span>
            <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600, letterSpacing: "0.3px" }}>
              Civic Redressal Portal
            </span>
          </div>
        </Link>

        {/* =========================
            MOBILE TOGGLER
        ========================= */}
        <button
          className="navbar-toggler border-0 shadow-none p-1"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* =========================
            NAVIGATION LINKS
        ========================= */}
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-center gap-1">
            {/* HOME */}
            <li className="nav-item">
              <Link
                className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
                to="/"
              >
                Home
              </Link>
            </li>

            {/* TRACK PETITION */}
            <li className="nav-item">
              <Link
                className={`nav-link ${location.pathname === "/track-petition" ? "active" : ""}`}
                to="/track-petition"
              >
                Track Status
              </Link>
            </li>

            {/* FEATURES */}
            <li className="nav-item">
              {isHomePage ? (
                <a className="nav-link" href="#features">
                  Features
                </a>
              ) : (
                <Link className="nav-link" to="/#features">
                  Features
                </Link>
              )}
            </li>

            {/* ABOUT */}
            <li className="nav-item">
              {isHomePage ? (
                <a className="nav-link" href="#about">
                  About
                </a>
              ) : (
                <Link className="nav-link" to="/#about">
                  About
                </Link>
              )}
            </li>

            {/* CONTEXTUAL AUTH BUTTONS */}
            {citizenUser ? (
              <li className="nav-item dropdown ms-lg-2">
                <div className="d-flex align-items-center gap-2">
                  <Link
                    to="/citizen-dashboard"
                    className="btn btn-sm btn-outline-primary fw-semibold px-3"
                    style={{ borderRadius: "8px" }}
                  >
                    👤 {citizenUser.full_name?.split(" ")[0] || "Dashboard"}
                  </Link>
                  <button
                    onClick={handleCitizenLogout}
                    className="btn btn-sm btn-light text-danger fw-semibold px-2"
                    title="Logout"
                    style={{ borderRadius: "8px" }}
                  >
                    Logout
                  </button>
                </div>
              </li>
            ) : officerUser ? (
              <li className="nav-item ms-lg-2">
                <Link
                  to="/officer-dashboard"
                  className="btn btn-sm btn-officer px-3"
                  style={{ borderRadius: "8px" }}
                >
                  👮 Officer Portal
                </Link>
              </li>
            ) : adminUser ? (
              <li className="nav-item ms-lg-2">
                <Link
                  to="/admin-dashboard"
                  className="btn btn-sm btn-dark px-3"
                  style={{ borderRadius: "8px" }}
                >
                  ⚡ Admin Panel
                </Link>
              </li>
            ) : (
              <>
                <li className="nav-item ms-lg-2">
                  <Link
                    to="/citizen-login"
                    className="btn btn-sm btn-outline-primary fw-semibold px-3"
                    style={{ borderRadius: "8px" }}
                  >
                    Citizen Login
                  </Link>
                </li>

                <li className="nav-item ms-lg-1">
                  <Link
                    to="/officer-login"
                    className="btn btn-sm btn-outline-secondary fw-semibold px-3"
                    style={{ borderRadius: "8px" }}
                  >
                    Officer
                  </Link>
                </li>

                <li className="nav-item ms-lg-1">
                  <Link
                    to="/admin-login"
                    className="btn btn-sm px-3"
                    style={{
                      background: "#1E3A8A",
                      color: "white",
                      borderRadius: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Admin
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;