import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { clearStaleTokens } from "../utils/axiosConfig";

function OfficerLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/officer/login",
        {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }
      );

      if (response.data.success) {
        clearStaleTokens("officer");
        sessionStorage.setItem("officer", JSON.stringify(response.data.officer));
        sessionStorage.setItem("officerToken", response.data.token);
        navigate("/officer-dashboard");
      } else {
        setErrorMsg(response.data.message || "Officer login failed.");
      }
    } catch (error) {
      console.error("Officer login error:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMsg(error.response.data.message);
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
                      background: "#EFF6FF",
                      fontSize: "28px",
                      border: "2px solid #DBEAFE",
                    }}
                  >
                    👮
                  </div>
                  <h2 className="fw-bold text-dark mb-1">Officer Login</h2>
                  <p className="text-muted small">
                    Municipal & Departmental Grievance Resolution Portal
                  </p>
                </div>

                {/* Inline Error */}
                {errorMsg && (
                  <div className="gov-alert gov-alert-danger mb-4">
                    <strong>⚠️ Error: </strong> {errorMsg}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  {/* Email */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="officer@department.gov.in"
                      required
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
                        placeholder="Enter your officer password"
                        required
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn-main w-100 py-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Verifying Credentials...
                      </>
                    ) : (
                      "Sign In to Officer Portal"
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-3 border-top text-center text-muted small">
                  <span>Authorized department personnel only. Contact Admin for credentials.</span>
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

export default OfficerLogin;