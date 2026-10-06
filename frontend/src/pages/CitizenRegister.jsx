import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash, FaCheck, FaTimes, FaShieldAlt, FaEnvelope, FaLock, FaUser, FaPhone } from "react-icons/fa";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function CitizenRegister() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    // Inline Alert State
    const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });

    // Field-specific validation errors
    const [fieldErrors, setFieldErrors] = useState({
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        otp: ""
    });

    // Password criteria check
    const passwordCriteria = {
        length: formData.password.length >= 8,
        upper: /[A-Z]/.test(formData.password),
        lower: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(formData.password)
    };

    const isPasswordStrong = Object.values(passwordCriteria).every(Boolean);
    const strengthScore = Object.values(passwordCriteria).filter(Boolean).length;
    const strengthPercentage = (strengthScore / 5) * 100;

    const getStrengthColor = () => {
        if (strengthScore <= 2) return "#EF4444";
        if (strengthScore <= 4) return "#F59E0B";
        return "#10B981";
    };

    const getStrengthLabel = () => {
        if (formData.password.length === 0) return "";
        if (strengthScore <= 2) return "Weak";
        if (strengthScore <= 4) return "Moderate";
        return "Strong";
    };

    // =====================================================
    // HANDLE INPUT CHANGE
    // =====================================================
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Clear field error on typing
        setFieldErrors(prev => ({ ...prev, [name]: "" }));

        // Phone: numbers only, maximum 10 digits
        if (name === "phone") {
            if (!/^\d*$/.test(value)) return;
            if (value.length > 10) return;
        }

        // If email is changed after OTP was verified, invalidate verification
        if (name === "email") {
            setOtpSent(false);
            setOtpVerified(false);
            setOtp("");
        }

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // =====================================================
    // REAL-TIME / ON-BLUR DUPLICATE CHECK
    // =====================================================
    const checkDuplicate = async (field, value) => {
        if (!value) return;

        if (field === "email") {
            const cleanEmail = value.trim().toLowerCase();
            if (!cleanEmail.endsWith("@gmail.com")) {
                setFieldErrors(prev => ({ ...prev, email: "Please enter a valid Gmail address (@gmail.com)" }));
                return;
            }

            try {
                const res = await axios.post("https://smart-grievance-backend-b6ow.onrender.com/api/auth/check-duplicate", { email: cleanEmail });
                if (!res.data.success && res.data.duplicate === "email") {
                    setFieldErrors(prev => ({ ...prev, email: res.data.message }));
                } else {
                    setFieldErrors(prev => ({ ...prev, email: "" }));
                }
            } catch (err) {
                console.error("Duplicate check error:", err);
            }
        }

        if (field === "phone") {
            if (value.length === 10) {
                try {
                    const res = await axios.post("https://smart-grievance-backend-b6ow.onrender.com/api/auth/check-duplicate", { phone: value });
                    if (!res.data.success && res.data.duplicate === "phone") {
                        setFieldErrors(prev => ({ ...prev, phone: res.data.message }));
                    } else {
                        setFieldErrors(prev => ({ ...prev, phone: "" }));
                    }
                } catch (err) {
                    console.error("Duplicate phone check error:", err);
                }
            }
        }
    };

    // =====================================================
    // SEND EMAIL OTP
    // =====================================================
    const handleSendOTP = async () => {
        setAlertMessage({ type: "", message: "" });
        setFieldErrors(prev => ({ ...prev, email: "", otp: "" }));

        const cleanEmail = formData.email.trim().toLowerCase();

        // Gmail validation
        if (!/^[^\s@]+@gmail\.com$/.test(cleanEmail)) {
            setFieldErrors(prev => ({ ...prev, email: "Please enter a valid Gmail address (@gmail.com)" }));
            setAlertMessage({ type: "danger", message: "Please enter a valid Gmail address" });
            return;
        }

        try {
            setOtpLoading(true);

            const response = await axios.post(
                "https://smart-grievance-backend-b6ow.onrender.com/api/auth/send-email-otp",
                { email: cleanEmail }
            );

            if (response.data.success) {
                setOtpSent(true);
                setOtpVerified(false);
                setOtp("");
                setAlertMessage({
                    type: "success",
                    message: "OTP has been sent to your Gmail. Please check your Inbox or Spam folder."
                });
            } else {
                setAlertMessage({ type: "danger", message: response.data.message });
                if (response.data.message.toLowerCase().includes("email")) {
                    setFieldErrors(prev => ({ ...prev, email: response.data.message }));
                }
            }
        } catch (error) {
            console.error("Send OTP error:", error);
            const msg = error.response?.data?.message || "Failed to send OTP. Please try again.";
            setAlertMessage({ type: "danger", message: msg });
            if (msg.toLowerCase().includes("email")) {
                setFieldErrors(prev => ({ ...prev, email: msg }));
            }
        } finally {
            setOtpLoading(false);
        }
    };

    // =====================================================
    // VERIFY EMAIL OTP
    // =====================================================
    const handleVerifyOTP = async () => {
        setAlertMessage({ type: "", message: "" });
        setFieldErrors(prev => ({ ...prev, otp: "" }));

        if (!otp) {
            setFieldErrors(prev => ({ ...prev, otp: "Please enter the OTP" }));
            setAlertMessage({ type: "danger", message: "Please enter the OTP" });
            return;
        }

        if (otp.length !== 6) {
            setFieldErrors(prev => ({ ...prev, otp: "OTP must contain exactly 6 digits" }));
            setAlertMessage({ type: "danger", message: "OTP must contain exactly 6 digits" });
            return;
        }

        try {
            setOtpLoading(true);

            const response = await axios.post(
                "https://smart-grievance-backend-b6ow.onrender.com/api/auth/verify-email-otp",
                {
                    email: formData.email.trim().toLowerCase(),
                    otp: otp.trim()
                }
            );

            if (response.data.success) {
                setOtpVerified(true);
                setAlertMessage({ type: "success", message: "Gmail verified successfully ✓" });
            } else {
                setAlertMessage({ type: "danger", message: response.data.message || "Invalid OTP" });
                setFieldErrors(prev => ({ ...prev, otp: response.data.message || "Invalid OTP" }));
            }
        } catch (error) {
            console.error("Verify OTP error:", error);
            const msg = error.response?.data?.message || "OTP verification failed";
            setAlertMessage({ type: "danger", message: msg });
            setFieldErrors(prev => ({ ...prev, otp: msg }));
        } finally {
            setOtpLoading(false);
        }
    };

    // =====================================================
    // REGISTER
    // =====================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlertMessage({ type: "", message: "" });

        // Phone validation
        if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
            setFieldErrors(prev => ({ ...prev, phone: "Phone number must contain exactly 10 digits" }));
            setAlertMessage({ type: "danger", message: "Phone number must contain exactly 10 digits" });
            return;
        }

        // Gmail OTP validation
        if (!otpVerified) {
            setAlertMessage({ type: "warning", message: "Please verify your Gmail using OTP before submitting" });
            return;
        }

        // Strong password validation
        if (!isPasswordStrong) {
            setFieldErrors(prev => ({
                ...prev,
                password: "Password must satisfy all security requirements (8+ chars, uppercase, lowercase, number, special char)."
            }));
            setAlertMessage({ type: "danger", message: "Password does not meet the security requirements." });
            return;
        }

        // Confirm Password validation
        if (formData.password !== formData.confirmPassword) {
            setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
            setAlertMessage({ type: "danger", message: "Passwords do not match" });
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                "https://smart-grievance-backend-b6ow.onrender.com/api/auth/register",
                {
                    full_name: formData.full_name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    phone: formData.phone.trim(),
                    password: formData.password,
                }
            );

            if (response.data.success) {
                setAlertMessage({ type: "success", message: "Registration successful! Redirecting to login..." });
                setTimeout(() => {
                    navigate("/citizen-login");
                }, 1500);
            } else {
                setAlertMessage({ type: "danger", message: response.data.message });
                if (response.data.message?.toLowerCase().includes("email")) {
                    setFieldErrors(prev => ({ ...prev, email: response.data.message }));
                } else if (response.data.message?.toLowerCase().includes("phone")) {
                    setFieldErrors(prev => ({ ...prev, phone: response.data.message }));
                }
            }
        } catch (error) {
            console.error("Registration error:", error);
            const msg = error.response?.data?.message || "Registration failed. Please check your details.";
            setAlertMessage({ type: "danger", message: msg });

            if (msg.toLowerCase().includes("email")) {
                setFieldErrors(prev => ({ ...prev, email: msg }));
            } else if (msg.toLowerCase().includes("phone")) {
                setFieldErrors(prev => ({ ...prev, phone: msg }));
            } else if (msg.toLowerCase().includes("password")) {
                setFieldErrors(prev => ({ ...prev, password: msg }));
            }
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
                        <div className="col-lg-7 col-md-9">

                            <div className="gov-card">
                                <div className="card-header-gov d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 className="fw-bold mb-0">Citizen Registration</h4>
                                        <small className="text-white-50">Create an official account to submit and track grievances</small>
                                    </div>
                                    <div className="p-2 rounded-circle bg-white bg-opacity-10 text-white">
                                        <FaShieldAlt size={22} />
                                    </div>
                                </div>

                                <div className="p-4 p-md-5">

                                    {/* INLINE ALERT BANNER */}
                                    {alertMessage.message && (
                                        <div className={`gov-alert gov-alert-${alertMessage.type}`}>
                                            <span className="alert-icon">
                                                {alertMessage.type === "success" ? "✓" : alertMessage.type === "warning" ? "⚠️" : "✕"}
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

                                        {/* FULL NAME */}
                                        <div className="mb-4">
                                            <label className="form-label">
                                                <FaUser className="me-2 text-primary" /> Full Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="full_name"
                                                value={formData.full_name}
                                                onChange={handleChange}
                                                placeholder="Enter your full legal name"
                                                required
                                            />
                                        </div>

                                        {/* GMAIL ADDRESS WITH OTP */}
                                        <div className="mb-4">
                                            <label className="form-label">
                                                <FaEnvelope className="me-2 text-primary" /> Gmail Address <span className="text-danger">*</span>
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    type="email"
                                                    className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    onBlur={() => checkDuplicate("email", formData.email)}
                                                    placeholder="example@gmail.com"
                                                    required
                                                    disabled={otpVerified}
                                                />
                                                <button
                                                    type="button"
                                                    className={`btn ${otpVerified ? "btn-success" : "btn-primary"} px-3`}
                                                    onClick={handleSendOTP}
                                                    disabled={otpLoading || otpVerified || !formData.email}
                                                >
                                                    {otpLoading ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-1" /> Sending...
                                                        </>
                                                    ) : otpVerified ? (
                                                        "Verified ✓"
                                                    ) : otpSent ? (
                                                        "Resend OTP"
                                                    ) : (
                                                        "Send OTP"
                                                    )}
                                                </button>
                                            </div>
                                            {fieldErrors.email ? (
                                                <div className="field-error-text">
                                                    <span>✕</span> {fieldErrors.email}
                                                </div>
                                            ) : (
                                                <small className="text-muted d-block mt-1">
                                                    Official OTP will be sent to your Gmail for verification.
                                                </small>
                                            )}
                                        </div>

                                        {/* OTP INPUT (SHOWN ONCE OTP IS SENT & NOT VERIFIED) */}
                                        {otpSent && !otpVerified && (
                                            <div className="mb-4 p-3 bg-light rounded-3 border">
                                                <label className="form-label fw-bold text-primary">
                                                    Enter 6-Digit Gmail OTP <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className={`form-control ${fieldErrors.otp ? "is-invalid" : ""}`}
                                                        value={otp}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (/^\d*$/.test(val) && val.length <= 6) {
                                                                setOtp(val);
                                                                setFieldErrors(prev => ({ ...prev, otp: "" }));
                                                            }
                                                        }}
                                                        placeholder="e.g. 481920"
                                                        maxLength="6"
                                                        inputMode="numeric"
                                                        style={{ letterSpacing: "4px", fontSize: "1.1rem", fontWeight: 700 }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-success px-4"
                                                        onClick={handleVerifyOTP}
                                                        disabled={otpLoading || otp.length !== 6}
                                                    >
                                                        {otpLoading ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-1" /> Verifying...
                                                            </>
                                                        ) : (
                                                            "Verify OTP"
                                                        )}
                                                    </button>
                                                </div>
                                                {fieldErrors.otp && (
                                                    <div className="field-error-text">
                                                        <span>✕</span> {fieldErrors.otp}
                                                    </div>
                                                )}
                                                <small className="text-muted d-block mt-1">
                                                    Check your inbox or spam folder for the 6-digit verification code.
                                                </small>
                                            </div>
                                        )}

                                        {/* OTP VERIFIED BADGE */}
                                        {otpVerified && (
                                            <div className="gov-alert gov-alert-success py-2 mb-4">
                                                <FaCheck className="text-success mt-1" />
                                                <span className="fw-semibold">Gmail verified successfully ✓</span>
                                            </div>
                                        )}

                                        {/* PHONE NUMBER */}
                                        <div className="mb-4">
                                            <label className="form-label">
                                                <FaPhone className="me-2 text-primary" /> Phone Number <span className="text-danger">*</span>
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light text-muted fw-bold">+91</span>
                                                <input
                                                    type="text"
                                                    className={`form-control ${fieldErrors.phone ? "is-invalid" : ""}`}
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    onBlur={() => checkDuplicate("phone", formData.phone)}
                                                    placeholder="10-digit mobile number"
                                                    maxLength="10"
                                                    inputMode="numeric"
                                                    required
                                                />
                                            </div>
                                            {fieldErrors.phone ? (
                                                <div className="field-error-text">
                                                    <span>✕</span> {fieldErrors.phone}
                                                </div>
                                            ) : (
                                                <small className="text-muted d-block mt-1">
                                                    Enter exactly 10 digits without country code.
                                                </small>
                                            )}
                                        </div>

                                        {/* PASSWORD WITH VISIBILITY & CHECKLIST */}
                                        <div className="mb-4">
                                            <label className="form-label">
                                                <FaLock className="me-2 text-primary" /> Password <span className="text-danger">*</span>
                                            </label>
                                            <div className="input-group-password">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className={`form-control ${fieldErrors.password ? "is-invalid" : ""}`}
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    placeholder="Create strong password (e.g. Abcd@123)"
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

                                            {fieldErrors.password && (
                                                <div className="field-error-text">
                                                    <span>✕</span> {fieldErrors.password}
                                                </div>
                                            )}

                                            {/* PASSWORD STRENGTH BAR & CHECKLIST */}
                                            {formData.password.length > 0 && (
                                                <div className="password-checklist mt-2">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <span className="password-checklist-title">Password Requirements:</span>
                                                        <span className="badge" style={{ backgroundColor: getStrengthColor(), color: "#fff" }}>
                                                            {getStrengthLabel()}
                                                        </span>
                                                    </div>

                                                    <div className="strength-bar-container">
                                                        <div
                                                            className="strength-bar-fill"
                                                            style={{
                                                                width: `${strengthPercentage}%`,
                                                                backgroundColor: getStrengthColor()
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="row g-1">
                                                        <div className="col-sm-6">
                                                            <div className={`password-criteria-item ${passwordCriteria.length ? "valid" : "invalid"}`}>
                                                                {passwordCriteria.length ? <FaCheck className="text-success" /> : <FaTimes className="text-muted" />}
                                                                <span>8+ characters</span>
                                                            </div>
                                                            <div className={`password-criteria-item ${passwordCriteria.upper ? "valid" : "invalid"}`}>
                                                                {passwordCriteria.upper ? <FaCheck className="text-success" /> : <FaTimes className="text-muted" />}
                                                                <span>Uppercase letter (A-Z)</span>
                                                            </div>
                                                            <div className={`password-criteria-item ${passwordCriteria.lower ? "valid" : "invalid"}`}>
                                                                {passwordCriteria.lower ? <FaCheck className="text-success" /> : <FaTimes className="text-muted" />}
                                                                <span>Lowercase letter (a-z)</span>
                                                            </div>
                                                        </div>

                                                        <div className="col-sm-6">
                                                            <div className={`password-criteria-item ${passwordCriteria.number ? "valid" : "invalid"}`}>
                                                                {passwordCriteria.number ? <FaCheck className="text-success" /> : <FaTimes className="text-muted" />}
                                                                <span>Number (0-9)</span>
                                                            </div>
                                                            <div className={`password-criteria-item ${passwordCriteria.special ? "valid" : "invalid"}`}>
                                                                {passwordCriteria.special ? <FaCheck className="text-success" /> : <FaTimes className="text-muted" />}
                                                                <span>Special char (!@#$%^&*)</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* CONFIRM PASSWORD WITH VISIBILITY */}
                                        <div className="mb-4">
                                            <label className="form-label">
                                                <FaLock className="me-2 text-primary" /> Confirm Password <span className="text-danger">*</span>
                                            </label>
                                            <div className="input-group-password">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    className={`form-control ${fieldErrors.confirmPassword ? "is-invalid" : ""}`}
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    placeholder="Re-enter your password"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-password-toggle"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    aria-label="Toggle confirm password visibility"
                                                    tabIndex={-1}
                                                >
                                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                            {fieldErrors.confirmPassword ? (
                                                <div className="field-error-text">
                                                    <span>✕</span> {fieldErrors.confirmPassword}
                                                </div>
                                            ) : formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword ? (
                                                <div className="text-success small mt-1 fw-semibold d-flex align-items-center gap-1">
                                                    <FaCheck /> Passwords match
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* SUBMIT BUTTON */}
                                        <button
                                            type="submit"
                                            className="btn-main w-100 py-3 mt-2"
                                            disabled={loading || !otpVerified || !isPasswordStrong || (formData.password !== formData.confirmPassword)}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                                                    Creating Account...
                                                </>
                                            ) : (
                                                "Complete Registration"
                                            )}
                                        </button>
                                    </form>

                                    <div className="text-center mt-4 pt-3 border-top">
                                        <p className="text-muted mb-0">
                                            Already registered?{" "}
                                            <Link to="/citizen-login" className="fw-bold text-primary text-decoration-none">
                                                Citizen Login →
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

export default CitizenRegister;