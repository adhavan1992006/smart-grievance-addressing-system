import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import hero from "../assets/hero.png";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Hero Section */}
      <section
        className="container"
        style={{
          minHeight: "92vh",
          display: "flex",
          alignItems: "center",
          paddingTop: "100px",
          paddingBottom: "50px",
        }}
      >
        <div className="row align-items-center g-5">
          {/* Left Side */}
          <div className="col-lg-6">
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-3" style={{ background: "#DBEAFE", color: "#1E3A8A", fontSize: "0.88rem", fontWeight: 700 }}>
              <span>🏛️</span> Madurai Civic Grievance Portal • AI Powered
            </div>

            <h1 className="section-title">
              Smart Grievance
              <br />
              <span style={{ color: "#2563EB" }}>Addressing System</span>
            </h1>

            <p className="section-subtitle mt-4">
              A modern, transparent civic-tech platform enabling citizens of Madurai to submit, track, and monitor public grievances in real time. Empowering municipal officers with AI-driven categorization, priority ranking, and interactive spatial maps.
            </p>

            <div className="d-flex flex-wrap gap-3 mt-4 pt-2">
              <Link to="/citizen-login" className="btn-main">
                Citizen Portal 📝
              </Link>

              <Link to="/track-petition" className="btn btn-outline-primary fw-semibold px-4 py-2" style={{ borderRadius: "8px" }}>
                Track Grievance 🔍
              </Link>

              <Link to="/officer-login" className="btn-officer">
                Officer Login 👮
              </Link>
            </div>

            <div className="d-flex align-items-center gap-4 mt-4 pt-3 text-muted small border-top">
              <div className="d-flex align-items-center gap-2">
                <span className="text-success fw-bold">✓</span> 100% Digital Redressal
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="text-success fw-bold">✓</span> AI Category Auto-Detect
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="text-success fw-bold">✓</span> OTP Verified
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="col-lg-6 text-center">
            <div className="p-3" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)" }}>
              <img
                src={hero}
                alt="Smart Grievance Portal"
                className="img-fluid"
                style={{
                  maxHeight: "440px",
                  filter: "drop-shadow(0 15px 30px rgba(30, 58, 138, 0.15))"
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-5">
        <div className="text-center mb-5">
          <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-2 rounded-pill mb-2">
            CORE CAPABILITIES
          </span>
          <h2 className="section-title">
            Why Choose Our System?
          </h2>
          <p className="section-subtitle mx-auto">
            Intelligent public grievance management powered by AI categorization and real-time geographic monitoring.
          </p>
        </div>

        <div className="row g-4">
          <div className="col-md-6 col-lg-3">
            <div className="feature-card">
              <div className="feature-icon">
                🤖
              </div>
              <h4>AI Analysis</h4>
              <p className="text-muted small">
                Automatically categorizes public complaints with high accuracy using machine learning algorithms.
              </p>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="feature-card">
              <div className="feature-icon">
                📍
              </div>
              <h4>Live GIS Map</h4>
              <p className="text-muted small">
                Visualize all complaints on an interactive Leaflet and Google Maps spatial interface by locality.
              </p>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="feature-card">
              <div className="feature-icon">
                📊
              </div>
              <h4>Smart Analytics</h4>
              <p className="text-muted small">
                Officers monitor high-frequency problem areas and category priorities for swift resource allocation.
              </p>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="feature-card">
              <div className="feature-icon">
                🔍
              </div>
              <h4>Live Tracking</h4>
              <p className="text-muted small">
                Citizens track real-time progression from submission and review to on-ground resolution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="container py-5">
        <div className="gov-card p-4 p-lg-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-2 rounded-pill mb-2">
                ABOUT THE INITIATIVE
              </span>
              <h3 className="fw-bold text-navy mb-3" style={{ color: "#1E3A8A" }}>
                Transforming Municipal Redressal for Citizens & Officers
              </h3>
              <p className="text-muted mb-3" style={{ lineHeight: "1.7" }}>
                The <strong>Smart Grievance Addressing System</strong> bridges the gap between citizens and municipal administrators. By combining modern mobile-responsive web interfaces, Google Maps geotagging, AI problem classification, and officer prioritization dashboards, grievances are routed and resolved with accountability.
              </p>
              <div className="row g-3 mt-2">
                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <h6 className="fw-bold mb-1">⚡ Fast Redressal</h6>
                    <small className="text-muted">Automated routing directly to assigned municipal wings.</small>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <h6 className="fw-bold mb-1">🔒 Secure & Verified</h6>
                    <small className="text-muted">Gmail OTP verification prevents fake or duplicate submissions.</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-5 text-center">
              <div className="p-4 bg-primary text-white rounded-4 shadow">
                <h4 className="fw-bold mb-2">Citizen Helpline</h4>
                <p className="small text-white-50 mb-3">Available 24/7 for civic emergencies and general inquiries</p>
                <div className="display-6 fw-bold mb-2">1800-425-0102</div>
                <p className="small mb-0 text-white-50">Toll Free Municipal Support Desk</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="container py-5">
        <div className="row text-center g-4">
          <div className="col-md-3 col-sm-6">
            <div className="stats-card">
              <h2>1,250+</h2>
              <p>Petitions Submitted</p>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="stats-card">
              <h2>980+</h2>
              <p>Resolved Cases</p>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="stats-card">
              <h2>50+</h2>
              <p>Government Officers</p>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="stats-card">
              <h2>95%</h2>
              <p>Citizen Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;