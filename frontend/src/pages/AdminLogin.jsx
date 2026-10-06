import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { clearStaleTokens } from "../utils/axiosConfig";

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setErrorMsg("");
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      setLoading(true);
      const res = await axios.post(
        "https://smart-grievance-backend-b6ow.onrender.com/api/admin/login",
        formData
      );

      if (res.data.success) {
        clearStaleTokens("admin");
        sessionStorage.setItem("adminToken", res.data.token);
        sessionStorage.setItem("admin", JSON.stringify(res.data.admin));
        navigate("/admin-dashboard");
      } else {
        setErrorMsg(res.data.message || "Admin login failed.");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg("Unable to connect to server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-5">
              <div className="gov-card p-4 p-md-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: "64px",
                      height: "64px",
                      background: "#F1F5F9",
                      fontSize: "28px",
                      border: "2px solid #E2E8F0",
                    }}
                  >
                    🛡️
                  </div>
                  <h2 className="fw-bold text-dark mb-1">Admin Portal</h2>
                  <p className="text-muted small">
                    Central Municipal Administration & Officer Governance
                  </p>
                </div>

                {/* Inline Error */}
                {errorMsg && (
                  <div className="gov-alert gov-alert-danger mb-4">
                    <strong>⚠️ Error: </strong> {errorMsg}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin}>
                  {/* Username */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Admin Username</label>
                    <input
                      type="text"
                      className="form-control"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter administrator username"
                      required
                      autoComplete="username"
                    />
                  </div>

                  {/* Password with Eye Toggle */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Password</label>
                    <div className="input-group-password">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter administrator password"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="btn-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "👁️" : "🙈"}
                      </button>
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    className="btn w-100 py-3 text-white fw-bold"
                    style={{
                      background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                      borderRadius: "10px",
                      border: "none",
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Authenticating...
                      </>
                    ) : (
                      "Sign In to Admin Control"
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-3 border-top text-center text-muted small">
                  <span>Restricted access. All actions are logged and audited.</span>
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

export default AdminLogin;