import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="gov-footer pt-5 pb-4">
      <div className="container">
        <div className="row g-4 mb-4">
          {/* PORTAL INFO */}
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  background: "#1E3A8A",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                }}
              >
                🏛️
              </span>
              <h5 className="fw-bold mb-0 text-white">Smart Grievance</h5>
            </div>
            <p className="small text-secondary mb-3" style={{ lineHeight: "1.7" }}>
              An AI-assisted public grievance redressal portal enabling citizens to submit, categorize, and monitor municipal civic issues with speed and transparency.
            </p>
            <div className="footer-badge">
              <span>🛡️</span> Official Civic Grievance Portal
            </div>
          </div>

          {/* CITIZEN SERVICES */}
          <div className="col-lg-2 col-md-6">
            <h6 className="fw-bold text-white mb-3">Citizen Services</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
              <li>
                <Link to="/submit-petition">Submit Grievance</Link>
              </li>
              <li>
                <Link to="/track-petition">Track Petition</Link>
              </li>
              <li>
                <Link to="/citizen-login">Citizen Login</Link>
              </li>
              <li>
                <Link to="/citizen-register">Citizen Registration</Link>
              </li>
            </ul>
          </div>

          {/* ADMINISTRATION */}
          <div className="col-lg-3 col-md-6">
            <h6 className="fw-bold text-white mb-3">Administration</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
              <li>
                <Link to="/officer-login">Officer Dashboard</Link>
              </li>
              <li>
                <Link to="/officer-map">Live Complaint Map</Link>
              </li>
              <li>
                <Link to="/officer-problem-priority">Problem Prioritization</Link>
              </li>
              <li>
                <Link to="/admin-login">Admin Control Center</Link>
              </li>
            </ul>
          </div>

          {/* HELPLINE & CONTACT */}
          <div className="col-lg-3 col-md-6" id="contact">
            <h6 className="fw-bold text-white mb-3">Public Helplines</h6>
            <div className="small text-secondary d-flex flex-column gap-2">
              <div>
                <strong className="text-white">Municipal Helpline:</strong> 1800-425-0102
              </div>
              <div>
                <strong className="text-white">Email Support:</strong> grievance@madurai.gov.in
              </div>
              <div>
                <strong className="text-white">Working Hours:</strong> Mon - Sat (9:00 AM - 6:00 PM)
              </div>
              <div>
                <strong className="text-white">Location:</strong> Corporation Office, Madurai
              </div>
            </div>
          </div>
        </div>

        <hr style={{ borderColor: "rgba(255, 255, 255, 0.12)" }} className="my-4" />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small text-secondary">
          <p className="mb-0">
            © {new Date().getFullYear()} Smart Grievance Addressing System. All rights reserved.
          </p>
          <div className="d-flex gap-3">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;