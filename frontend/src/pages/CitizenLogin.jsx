import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUserCheck } from "react-icons/fa";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { clearStaleTokens } from "../utils/axiosConfig";

function CitizenLogin() {
    const navigate = useNavigate();

    const [loginData, setLoginData] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });

    const handleChange = (e) => {
        setAlertMessage({ type: "", message: "" });
        setLoginData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlertMessage({ type: "", message: "" });

        if (!loginData.email || !loginData.password) {
            setAlertMessage({ type: "danger", message: "Please enter your email and password" });
            return;
        }

        try {
            setLoading(true);

            const res = await axios.post(
                "http://localhost:5000/api/auth/login",
                {
                    email: loginData.email.trim().toLowerCase(),
                    password: loginData.password
                }
            );

            if (res.data.success) {
                clearStaleTokens("citizen");
                sessionStorage.setItem("citizenToken", res.data.token);
                sessionStorage.setItem("citizenUser", JSON.stringify(res.data.user));

                setAlertMessage({ type: "success", message: "Login successful! Redirecting..." });

                setTimeout(() => {
                    navigate("/citizen-dashboard");
                }, 800);
            } else {
                setAlertMessage({ type: "danger", message: res.data.message || "Invalid email or password" });
            }
        } catch (err) {
            console.error("Login error:", err);
            const msg = err.response?.data?.message || "Invalid email or password. Please try again.";
            setAlertMessage({ type: "danger", message: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <Navbar />

            <div className="page-content">
                <div className="container py-4">
                    <div className="row justify-content-center">
                        <div className="col-lg-5 col-md-8">

                            <div className="gov-card">
                                <div className="card-header-gov d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 className="fw-bold mb-0">Citizen Login</h4>
                                        <small className="text-white-50">Access your citizen dashboard and track petitions</small>
                                    </div>
                                    <div className="p-2 rounded-circle bg-white bg-opacity-10 text-white">
                                        <FaUserCheck size={22} />
                                    </div>
                                </div>

                                <div className="p-4 p-md-5">

                                    {/* INLINE ALERT */}
                                    {alertMessage.message && (
                                        <div className={`gov-alert gov-alert-${alertMessage.type}`}>
                                            <span className="alert-icon">
                                                {alertMessage.type === "success" ? "✓" : "✕"}
                                            </span>
                                            <div>{alertMessage.message}</div>
                                            <button
                                                type="button"
                                                className="alert-close"
                                                onClick={() => setAlertMessage({ type: "", message: "" })}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} noValidate>

                                        {/* EMAIL */}
                                        <div className="mb-4">
                                            <label className="form-label">
                                                <FaEnvelope className="me-2 text-primary" /> Gmail / Email Address <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                name="email"
                                                value={loginData.email}
                                                onChange={handleChange}
                                                placeholder="Enter your registered email"
                                                required
                                            />
                                        </div>

                                        {/* PASSWORD WITH EYE TOGGLE */}
                                        <div className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <label className="form-label mb-0">
                                                    <FaLock className="me-2 text-primary" /> Password <span className="text-danger">*</span>
                                                </label>
                                            </div>
                                            <div className="input-group-password">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="form-control"
                                                    name="password"
                                                    value={loginData.password}
                                                    onChange={handleChange}
                                                    placeholder="Enter your password"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-password-toggle"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    aria-label="Toggle password visibility"
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* SUBMIT BUTTON */}
                                        <button
                                            type="submit"
                                            className="btn-main w-100 py-3 mt-2"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                                                    Logging in...
                                                </>
                                            ) : (
                                                "Sign In to Portal"
                                            )}
                                        </button>

                                    </form>

                                    <div className="text-center mt-4 pt-3 border-top">
                                        <p className="text-muted mb-0">
                                            Don't have an account?{" "}
                                            <Link to="/citizen-register" className="fw-bold text-primary text-decoration-none">
                                                Register as Citizen →
                                            </Link>
                                        </p>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default CitizenLogin;