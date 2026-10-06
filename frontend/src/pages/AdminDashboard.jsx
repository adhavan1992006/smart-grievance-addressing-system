import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");

  const [officers, setOfficers] = useState([]);
  const [petitions, setPetitions] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [petitionLoading, setPetitionLoading] = useState(false);
  const [departmentLoading, setDepartmentLoading] = useState(false);

  const [editingOfficer, setEditingOfficer] = useState(null);
  const [officerToDelete, setOfficerToDelete] = useState(null);

  const [showPassword, setShowPassword] = useState(false);

  const [inlineAlert, setInlineAlert] = useState(null);

  /* =====================================================
     FORM DATA
  ===================================================== */

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    department_id: "",
    sub_role: "municipal",
  });

  /* =====================================================
     OTP STATES
  ===================================================== */

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  const [otpAlert, setOtpAlert] = useState(null);

  const [confirmPassword, setConfirmPassword] = useState("");

  /* =====================================================
     PASSWORD RULES
  ===================================================== */

  const [passwordRules, setPasswordRules] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const checkPasswordStrength = (pass) => {
    setPasswordRules({
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[@$!%*?&]/.test(pass),
    });
  };

  /* =====================================================
     HANDLE INPUT
  ===================================================== */

  const handleChange = (e) => {
    setInlineAlert(null);
    setOtpAlert(null);

    const { name, value } = e.target;

    /* Email changed → OTP becomes invalid */
    if (name === "email" && value !== formData.email) {
      setOtpVerified(false);
      setOtpSent(false);
      setOtpCode("");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      checkPasswordStrength(value);
    }
  };

  /* =====================================================
     HANDLE OFFICER TYPE
  ===================================================== */

  const handleOfficerTypeChange = (type) => {
    setInlineAlert(null);

    setFormData((prev) => ({
      ...prev,
      sub_role: type,
      department_id: type === "department" ? prev.department_id : "",
    }));
  };

  /* =====================================================
     LOAD DEPARTMENTS
  ===================================================== */

  const loadDepartments = async () => {
    try {
      setDepartmentLoading(true);

      const res = await axios.get(
        "https://smart-grievance-backend-b6ow.onrender.com/api/admin/departments"
      );

      if (res.data.success) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      console.error("Load Departments Error:", err);

      setInlineAlert({
        type: "danger",
        message: "Unable to load departments from server.",
      });
    } finally {
      setDepartmentLoading(false);
    }
  };

  /* =====================================================
     SEND OFFICER GMAIL OTP
  ===================================================== */

  const sendOfficerOtp = async () => {
    setOtpAlert(null);

    if (
      !formData.email ||
      !formData.email.trim().toLowerCase().endsWith("@gmail.com")
    ) {
      setOtpAlert({
        type: "danger",
        message: "Please enter a valid Gmail address (@gmail.com).",
      });
      return;
    }

    try {
      setOtpSending(true);

      const res = await axios.post(
        "https://smart-grievance-backend-b6ow.onrender.com/api/admin/send-officer-otp",
        {
          email: formData.email,
          full_name: formData.full_name,
        }
      );

      if (res.data.success) {
        setOtpSent(true);

        setOtpAlert({
          type: "success",
          message: "OTP sent successfully to " + formData.email,
        });
      } else {
        setOtpAlert({
          type: "danger",
          message: res.data.message || "Failed to send OTP.",
        });
      }
    } catch (err) {
      console.error("Send Officer OTP Error:", err);

      setOtpAlert({
        type: "danger",
        message:
          err.response?.data?.message ||
          "Error sending OTP to Gmail. Please try again.",
      });
    } finally {
      setOtpSending(false);
    }
  };

  /* =====================================================
     VERIFY OFFICER GMAIL OTP
  ===================================================== */

  const verifyOfficerOtp = async () => {
    setOtpAlert(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpAlert({
        type: "danger",
        message: "Please enter a 6-digit OTP code.",
      });

      return;
    }

    try {
      setOtpVerifying(true);

      const res = await axios.post(
        "https://smart-grievance-backend-b6ow.onrender.com/api/admin/verify-officer-otp",
        {
          email: formData.email,
          otp: otpCode,
        }
      );

      if (res.data.success) {
        setOtpVerified(true);

        setOtpAlert({
          type: "success",
          message: "✓ Gmail Verified Successfully!",
        });
      } else {
        setOtpAlert({
          type: "danger",
          message: res.data.message || "Invalid OTP code.",
        });
      }
    } catch (err) {
      console.error("Verify Officer OTP Error:", err);

      setOtpAlert({
        type: "danger",
        message:
          err.response?.data?.message ||
          "OTP verification failed. Try again.",
      });
    } finally {
      setOtpVerifying(false);
    }
  };

  /* =====================================================
     LOAD OFFICERS
  ===================================================== */

  const loadOfficers = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "https://smart-grievance-backend-b6ow.onrender.com/api/admin/officers"
      );

      if (res.data.success) {
        setOfficers(res.data.officers || []);
      }
    } catch (err) {
      console.error("Load Officers Error:", err);

      setInlineAlert({
        type: "danger",
        message: "Unable to load officers from server.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     LOAD PETITIONS
  ===================================================== */

  const loadPetitions = async () => {
    try {
      setPetitionLoading(true);

      const res = await axios.get(
        "https://smart-grievance-backend-b6ow.onrender.com/api/admin/petitions"
      );

      if (res.data.success) {
        setPetitions(res.data.petitions || []);
      }
    } catch (err) {
      console.error("Load Petitions Error:", err);

      setInlineAlert({
        type: "danger",
        message: "Unable to load complaints from server.",
      });
    } finally {
      setPetitionLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadOfficers();
    loadPetitions();
    loadDepartments();
  }, []);

  /* =====================================================
     RESET ADD OFFICER FORM
  ===================================================== */

  const resetOfficerForm = () => {
    setFormData({
      full_name: "",
      email: "",
      password: "",
      department_id: "",
      sub_role: "municipal",
    });

    setConfirmPassword("");

    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode("");

    setOtpAlert(null);
    setInlineAlert(null);

    setShowPassword(false);

    setPasswordRules({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    });
  };

  /* =====================================================
     ADD OFFICER
  ===================================================== */

  const addOfficer = async (e) => {
    e.preventDefault();

    setInlineAlert(null);

    /* OTP validation */

    if (!otpVerified) {
      setInlineAlert({
        type: "danger",
        message:
          "Gmail OTP verification is required before creating an officer account.",
      });

      return;
    }

    /* Password confirmation */

    if (formData.password !== confirmPassword) {
      setInlineAlert({
        type: "danger",
        message: "Account Password and Confirm Password do not match.",
      });

      return;
    }

    /* Strong password */

    const isPasswordValid =
      formData.password.length >= 8 &&
      /[A-Z]/.test(formData.password) &&
      /[a-z]/.test(formData.password) &&
      /[0-9]/.test(formData.password) &&
      /[@$!%*?&]/.test(formData.password);

    if (!isPasswordValid) {
      setInlineAlert({
        type: "danger",
        message:
          "Password must contain 8+ characters, uppercase, lowercase, number and special character.",
      });

      return;
    }

    /* Department validation */

    if (
      formData.sub_role === "department" &&
      !formData.department_id
    ) {
      setInlineAlert({
        type: "danger",
        message: "Please select a department for the Department Officer.",
      });

      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "https://smart-grievance-backend-b6ow.onrender.com/api/admin/add-officer",
        {
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          department_id:
            formData.sub_role === "department"
              ? parseInt(formData.department_id)
              : null,
          sub_role: formData.sub_role,
        }
      );

      if (res.data.success) {
        setInlineAlert({
          type: "success",
          message:
            res.data.message || "Officer added successfully!",
        });

        resetOfficerForm();

        await loadOfficers();

        setActiveTab("officers");
      } else {
        setInlineAlert({
          type: "danger",
          message:
            res.data.message || "Failed to add officer.",
        });
      }
    } catch (err) {
      console.error("Add Officer Error:", err);

      setInlineAlert({
        type: "danger",
        message:
          err.response?.data?.message ||
          "Unable to add officer.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     START EDIT
  ===================================================== */

  const startEdit = (officer) => {
    setEditingOfficer(officer);

    setFormData({
      full_name: officer.full_name || "",
      email: officer.email || "",
      password: "",
      department_id: officer.department_id || "",
      sub_role: officer.sub_role || "municipal",
    });

    setInlineAlert(null);

    setPasswordRules({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    });

    setActiveTab("editOfficer");
  };

  /* =====================================================
     UPDATE OFFICER
  ===================================================== */

  const updateOfficer = async (e) => {
    e.preventDefault();

    if (!editingOfficer) return;

    setInlineAlert(null);

    if (
      formData.sub_role === "department" &&
      !formData.department_id
    ) {
      setInlineAlert({
        type: "danger",
        message: "Please select a department.",
      });

      return;
    }

    /* Password validation if changed */

    if (formData.password) {
      const isPasswordValid =
        formData.password.length >= 8 &&
        /[A-Z]/.test(formData.password) &&
        /[a-z]/.test(formData.password) &&
        /[0-9]/.test(formData.password) &&
        /[@$!%*?&]/.test(formData.password);

      if (!isPasswordValid) {
        setInlineAlert({
          type: "danger",
          message:
            "New password must meet all security requirements.",
        });

        return;
      }
    }

    try {
      setLoading(true);

      const res = await axios.put(
        `https://smart-grievance-backend-b6ow.onrender.com/api/admin/officer/${editingOfficer.id}`,
        {
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          department_id:
            formData.sub_role === "department"
              ? parseInt(formData.department_id)
              : null,
          sub_role: formData.sub_role,
        }
      );

      if (res.data.success) {
        setInlineAlert({
          type: "success",
          message:
            res.data.message ||
            "Officer updated successfully!",
        });

        setEditingOfficer(null);

        resetOfficerForm();

        await loadOfficers();

        setActiveTab("officers");
      } else {
        setInlineAlert({
          type: "danger",
          message:
            res.data.message ||
            "Failed to update officer.",
        });
      }
    } catch (err) {
      console.error("Update Officer Error:", err);

      setInlineAlert({
        type: "danger",
        message:
          err.response?.data?.message ||
          "Unable to update officer.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     DELETE OFFICER
  ===================================================== */

  const confirmDeleteOfficer = async () => {
    if (!officerToDelete) return;

    try {
      setLoading(true);

      const res = await axios.delete(
        `https://smart-grievance-backend-b6ow.onrender.com/api/admin/officer/${officerToDelete.id}`
      );

      if (res.data.success) {
        setInlineAlert({
          type: "success",
          message: `Officer "${officerToDelete.full_name}" deleted successfully.`,
        });

        setOfficerToDelete(null);

        await loadOfficers();
      } else {
        setInlineAlert({
          type: "danger",
          message:
            res.data.message ||
            "Unable to delete officer.",
        });
      }
    } catch (err) {
      console.error("Delete Officer Error:", err);

      setInlineAlert({
        type: "danger",
        message:
          err.response?.data?.message ||
          "Unable to delete officer.",
      });
    } finally {
      setLoading(false);
      setOfficerToDelete(null);
    }
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const logout = () => {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("admin");

    navigate("/admin-login");
  };

  /* =====================================================
     CANCEL EDIT
  ===================================================== */

  const cancelEdit = () => {
    setEditingOfficer(null);

    resetOfficerForm();

    setActiveTab("officers");
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="page-wrapper">

      <Navbar />

      <main className="page-content">

        <div className="container-fluid px-lg-5">

          {/* =================================================
              TOP BANNER
          ================================================= */}

          <div
            className="card border-0 shadow-sm mb-4 text-white p-4"
            style={{
              background:
                "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
              borderRadius: "16px",
            }}
          >

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

              <div>

                <span className="badge bg-light text-dark fw-bold mb-2 px-3 py-1">
                  🛡️ Administrator Center
                </span>

                <h2 className="fw-bold mb-1">
                  Municipal Governance Command Panel
                </h2>

                <p className="mb-0 text-white-50">
                  Manage municipal officers, department staff,
                  civic complaints and grievance workflow.
                </p>

              </div>

              <button
                className="btn btn-outline-light px-3"
                onClick={logout}
              >
                🚪 Logout
              </button>

            </div>

          </div>

          {/* =================================================
              NAVIGATION TABS
          ================================================= */}

          <div className="d-flex flex-wrap gap-2 mb-4">

            <button
              className={`btn px-4 py-2 fw-semibold ${
                activeTab === "dashboard"
                  ? "btn-primary shadow-sm"
                  : "btn-outline-secondary"
              }`}
              style={{ borderRadius: "10px" }}
              onClick={() => setActiveTab("dashboard")}
            >
              📊 Overview
            </button>

            <button
              className={`btn px-4 py-2 fw-semibold ${
                activeTab === "officers"
                  ? "btn-primary shadow-sm"
                  : "btn-outline-secondary"
              }`}
              style={{ borderRadius: "10px" }}
              onClick={() => {
                loadOfficers();
                setActiveTab("officers");
              }}
            >
              👥 Officers ({officers.length})
            </button>

            <button
              className={`btn px-4 py-2 fw-semibold ${
                activeTab === "addOfficer"
                  ? "btn-primary shadow-sm"
                  : "btn-outline-secondary"
              }`}
              style={{ borderRadius: "10px" }}
              onClick={() => {
                setEditingOfficer(null);
                resetOfficerForm();
                setActiveTab("addOfficer");
              }}
            >
              ➕ Add Staff
            </button>

            <button
              className={`btn px-4 py-2 fw-semibold ${
                activeTab === "petitions"
                  ? "btn-primary shadow-sm"
                  : "btn-outline-secondary"
              }`}
              style={{ borderRadius: "10px" }}
              onClick={() => {
                loadPetitions();
                setActiveTab("petitions");
              }}
            >
              📋 Complaints ({petitions.length})
            </button>

          </div>

          {/* =================================================
              ALERT
          ================================================= */}

          {inlineAlert && (
            <div
              className={`gov-alert gov-alert-${inlineAlert.type} mb-4 d-flex justify-content-between align-items-center`}
            >
              <span>{inlineAlert.message}</span>

              <button
                type="button"
                className="btn-close"
                onClick={() => setInlineAlert(null)}
              />

            </div>
          )}

          {/* =================================================
              DASHBOARD
          ================================================= */}

          {activeTab === "dashboard" && (

            <div className="mb-5">

              <div className="row g-4 mb-4">

                <div className="col-md-3">

                  <div
                    className="gov-card p-4 h-100"
                    style={{ cursor: "pointer" }}
                    onClick={() => setActiveTab("officers")}
                  >

                    <span className="text-muted fw-semibold">
                      Total Staff
                    </span>

                    <h2 className="fw-bold text-dark mb-0 mt-2">
                      {officers.length}
                    </h2>

                    <small className="text-primary">
                      Manage staff →
                    </small>

                  </div>

                </div>

                <div className="col-md-3">

                  <div className="gov-card p-4 h-100">

                    <span className="text-muted fw-semibold">
                      Department Staff
                    </span>

                    <h2 className="fw-bold text-primary mb-0 mt-2">
                      {
                        officers.filter(
                          (o) =>
                            o.sub_role === "department"
                        ).length
                      }
                    </h2>

                    <small className="text-muted">
                      Department officers
                    </small>

                  </div>

                </div>

                <div className="col-md-3">

                  <div className="gov-card p-4 h-100">

                    <span className="text-muted fw-semibold">
                      Municipal Staff
                    </span>

                    <h2 className="fw-bold text-success mb-0 mt-2">
                      {
                        officers.filter(
                          (o) =>
                            o.sub_role !== "department"
                        ).length
                      }
                    </h2>

                    <small className="text-muted">
                      Municipal officers
                    </small>

                  </div>

                </div>

                <div className="col-md-3">

                  <div
                    className="gov-card p-4 h-100"
                    style={{ cursor: "pointer" }}
                    onClick={() => setActiveTab("petitions")}
                  >

                    <span className="text-muted fw-semibold">
                      Total Complaints
                    </span>

                    <h2 className="fw-bold text-dark mb-0 mt-2">
                      {petitions.length}
                    </h2>

                    <small className="text-primary">
                      View complaints →
                    </small>

                  </div>

                </div>

              </div>

              <div className="gov-card p-4">

                <h5 className="fw-bold text-dark">
                  🤖 AI Grievance Intelligence System
                </h5>

                <p className="text-muted small mb-0">
                  Natural language problem classification,
                  duplicate detection and geographic
                  prioritization algorithms are operating normally.
                </p>

              </div>

            </div>

          )}

          {/* =================================================
              OFFICERS LIST
          ================================================= */}

          {activeTab === "officers" && (

            <div className="gov-card overflow-hidden mb-5">

              <div
                className="p-3 text-white d-flex justify-content-between align-items-center"
                style={{ background: "#1E3A8A" }}
              >

                <h5 className="mb-0 fw-bold">
                  Registered Municipal & Department Staff
                </h5>

                <button
                  className="btn btn-sm btn-light text-primary fw-semibold"
                  onClick={() => {
                    setEditingOfficer(null);
                    resetOfficerForm();
                    setActiveTab("addOfficer");
                  }}
                >
                  ➕ Add Staff
                </button>

              </div>

              <div className="table-responsive">

                <table className="table gov-table table-hover mb-0">

                  <thead>

                    <tr>
                      <th>ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Staff Type</th>
                      <th>Department</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>

                  </thead>

                  <tbody>

                    {loading ? (

                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-5"
                        >
                          <div className="spinner-border text-primary" />
                          <p className="mt-2">
                            Loading officers...
                          </p>
                        </td>
                      </tr>

                    ) : officers.length === 0 ? (

                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-5"
                        >
                          👥
                          <p className="mt-2">
                            No officers registered yet.
                          </p>
                        </td>
                      </tr>

                    ) : (

                      officers.map((officer) => (

                        <tr key={officer.id}>

                          <td>
                            <strong>
                              #{officer.id}
                            </strong>
                          </td>

                          <td className="fw-semibold">
                            {officer.full_name}
                          </td>

                          <td>
                            <code>
                              {officer.email}
                            </code>
                          </td>

                          <td>

                            {officer.sub_role === "department" ? (

                              <span className="badge bg-primary">
                                🏢 Department Officer
                              </span>

                            ) : (

                              <span className="badge bg-success">
                                🏛️ Municipal Officer
                              </span>

                            )}

                          </td>

                          <td>

                            {officer.sub_role === "department" ? (

                              <span>
                                {officer.department ||
                                  "Department"}
                              </span>

                            ) : (

                              <span className="text-muted">
                                General Municipal
                              </span>

                            )}

                          </td>

                          <td className="small text-muted">

                            {officer.created_at
                              ? new Date(
                                  officer.created_at
                                ).toLocaleDateString(
                                  "en-IN",
                                  {
                                    dateStyle: "medium",
                                  }
                                )
                              : "-"}

                          </td>

                          <td>

                            <div className="d-flex gap-2">

                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  startEdit(officer)
                                }
                              >
                                ✏️ Edit
                              </button>

                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  setOfficerToDelete(officer)
                                }
                              >
                                🗑️ Delete
                              </button>

                            </div>

                          </td>

                        </tr>

                      ))

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          )}

          {/* =================================================
              ADD OFFICER
          ================================================= */}

          {activeTab === "addOfficer" && (

            <div className="row justify-content-center mb-5">

              <div className="col-12 col-lg-8">

                <div className="gov-card p-4 p-md-5">

                  <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">

                    <span style={{ fontSize: "28px" }}>
                      ➕
                    </span>

                    <div>

                      <h4 className="fw-bold text-dark mb-0">
                        Register New Staff
                      </h4>

                      <small className="text-muted">
                        Create credentials for municipal
                        and department grievance staff.
                      </small>

                    </div>

                  </div>

                  <form onSubmit={addOfficer}>

                    {/* FULL NAME */}

                    <div className="mb-3">

                      <label className="form-label fw-semibold">
                        Staff Full Name{" "}
                        <span className="text-danger">*</span>
                      </label>

                      <input
                        type="text"
                        className="form-control"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="e.g. Rajesh Kumar"
                        required
                      />

                    </div>

                    {/* STAFF TYPE */}

                    <div className="mb-4">

                      <label className="form-label fw-semibold">
                        Staff Type{" "}
                        <span className="text-danger">*</span>
                      </label>

                      <div className="row g-3">

                        <div className="col-md-6">

                          <div
                            className={`border rounded p-3 ${
                              formData.sub_role === "municipal"
                                ? "border-primary bg-primary bg-opacity-10"
                                : ""
                            }`}
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              handleOfficerTypeChange(
                                "municipal"
                              )
                            }
                          >

                            <div className="form-check">

                              <input
                                className="form-check-input"
                                type="radio"
                                name="sub_role"
                                checked={
                                  formData.sub_role ===
                                  "municipal"
                                }
                                onChange={() =>
                                  handleOfficerTypeChange(
                                    "municipal"
                                  )
                                }
                              />

                              <label className="form-check-label fw-semibold">
                                🏛️ Municipal Officer
                              </label>

                            </div>

                            <small className="text-muted ms-4">
                              Handles general municipal grievances.
                            </small>

                          </div>

                        </div>

                        <div className="col-md-6">

                          <div
                            className={`border rounded p-3 ${
                              formData.sub_role === "department"
                                ? "border-primary bg-primary bg-opacity-10"
                                : ""
                            }`}
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              handleOfficerTypeChange(
                                "department"
                              )
                            }
                          >

                            <div className="form-check">

                              <input
                                className="form-check-input"
                                type="radio"
                                name="sub_role"
                                checked={
                                  formData.sub_role ===
                                  "department"
                                }
                                onChange={() =>
                                  handleOfficerTypeChange(
                                    "department"
                                  )
                                }
                              />

                              <label className="form-check-label fw-semibold">
                                🏢 Department Officer
                              </label>

                            </div>

                            <small className="text-muted ms-4">
                              Handles complaints for a specific department.
                            </small>

                          </div>

                        </div>

                      </div>

                    </div>

                    {/* DEPARTMENT */}

                    {formData.sub_role === "department" && (

                      <div className="mb-4">

                        <label className="form-label fw-semibold">

                          Select Department{" "}

                          <span className="text-danger">
                            *
                          </span>

                        </label>

                        <select
                          className="form-select"
                          name="department_id"
                          value={formData.department_id}
                          onChange={handleChange}
                          required
                          disabled={departmentLoading}
                        >

                          <option value="">
                            {departmentLoading
                              ? "Loading departments..."
                              : "Select Department"}
                          </option>

                          {departments.map((department) => (

                            <option
                              key={department.id}
                              value={department.id}
                            >
                              {department.department_name}
                            </option>

                          ))}

                        </select>

                        <div className="form-text">
                          Select the department this officer belongs to.
                        </div>

                        {departments.length === 0 &&
                          !departmentLoading && (

                            <div className="alert alert-warning mt-2 py-2">
                              No departments found in the database.
                            </div>

                          )}

                      </div>

                    )}

                    {/* OTP ALERT */}

                    {otpAlert && (

                      <div
                        className={`gov-alert gov-alert-${otpAlert.type} mb-3`}
                      >
                        {otpAlert.message}
                      </div>

                    )}

                    {/* EMAIL */}

                    <div className="mb-3">

                      <label className="form-label fw-semibold">

                        Officer Gmail Address{" "}

                        <span className="text-danger">
                          *
                        </span>

                      </label>

                      <div className="input-group">

                        <input
                          type="email"
                          className={`form-control ${
                            otpVerified
                              ? "is-valid border-success"
                              : ""
                          }`}
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="officer.name@gmail.com"
                          required
                          disabled={otpVerified}
                        />

                        <button
                          type="button"
                          className={`btn ${
                            otpVerified
                              ? "btn-success"
                              : "btn-outline-primary"
                          } fw-semibold`}
                          onClick={sendOfficerOtp}
                          disabled={
                            otpSending ||
                            otpVerified ||
                            !formData.email
                              .trim()
                              .toLowerCase()
                              .endsWith("@gmail.com")
                          }
                        >

                          {otpSending ? (

                            <>
                              <span className="spinner-border spinner-border-sm me-1" />
                              Sending...
                            </>

                          ) : otpVerified ? (

                            "✓ Verified"

                          ) : (

                            "Send OTP"

                          )}

                        </button>

                      </div>

                      <div className="form-text text-muted">
                        Only official Gmail accounts (@gmail.com)
                        are accepted.
                      </div>

                    </div>

                    {/* OTP */}

                    {otpSent && !otpVerified && (

                      <div className="mb-3 p-3 bg-light rounded border border-primary border-opacity-25">

                        <label className="form-label fw-semibold">
                          Enter 6-Digit Gmail OTP{" "}
                          <span className="text-danger">*</span>
                        </label>

                        <div className="input-group">

                          <input
                            type="text"
                            className="form-control text-center fw-bold fs-5"
                            placeholder="123456"
                            maxLength="6"
                            value={otpCode}
                            onChange={(e) =>
                              setOtpCode(
                                e.target.value.replace(
                                  /\D/g,
                                  ""
                                )
                              )
                            }
                          />

                          <button
                            type="button"
                            className="btn btn-primary fw-semibold px-4"
                            onClick={verifyOfficerOtp}
                            disabled={
                              otpVerifying ||
                              otpCode.trim().length !== 6
                            }
                          >

                            {otpVerifying ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" />
                                Verifying...
                              </>
                            ) : (
                              "Verify OTP"
                            )}

                          </button>

                        </div>

                        <small className="text-muted d-block mt-1">
                          OTP was sent to {formData.email}.
                          Valid for 5 minutes.
                        </small>

                      </div>

                    )}

                    {otpVerified && (

                      <div className="alert alert-success d-flex align-items-center gap-2 mb-3 py-2">

                        <span>✅</span>

                        <strong className="small">
                          Gmail OTP Verified! You can now create
                          the staff account.
                        </strong>

                      </div>

                    )}

                    {/* PASSWORD */}

                    <div className="mb-3">

                      <label className="form-label fw-semibold">

                        Account Password{" "}

                        <span className="text-danger">
                          *
                        </span>

                      </label>

                      <div className="input-group-password">

                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          className="form-control"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create strong officer password"
                          required
                        />

                        <button
                          type="button"
                          className="btn-password-toggle"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                        >
                          {showPassword
                            ? "👁️"
                            : "🙈"}
                        </button>

                      </div>

                      {/* PASSWORD CHECKLIST */}

                      {formData.password && (

                        <div className="password-checklist mt-3">

                          <small className="fw-bold text-muted d-block mb-2">
                            Password Requirements:
                          </small>

                          <div className="row g-2">

                            <div className="col-6">

                              <div
                                className={`rule-item ${
                                  passwordRules.length
                                    ? "valid"
                                    : "invalid"
                                }`}
                              >
                                {passwordRules.length
                                  ? "✓"
                                  : "○"}{" "}
                                At least 8 characters
                              </div>

                            </div>

                            <div className="col-6">

                              <div
                                className={`rule-item ${
                                  passwordRules.uppercase
                                    ? "valid"
                                    : "invalid"
                                }`}
                              >
                                {passwordRules.uppercase
                                  ? "✓"
                                  : "○"}{" "}
                                One uppercase letter
                              </div>

                            </div>

                            <div className="col-6">

                              <div
                                className={`rule-item ${
                                  passwordRules.lowercase
                                    ? "valid"
                                    : "invalid"
                                }`}
                              >
                                {passwordRules.lowercase
                                  ? "✓"
                                  : "○"}{" "}
                                One lowercase letter
                              </div>

                            </div>

                            <div className="col-6">

                              <div
                                className={`rule-item ${
                                  passwordRules.number
                                    ? "valid"
                                    : "invalid"
                                }`}
                              >
                                {passwordRules.number
                                  ? "✓"
                                  : "○"}{" "}
                                One number
                              </div>

                            </div>

                            <div className="col-12">

                              <div
                                className={`rule-item ${
                                  passwordRules.special
                                    ? "valid"
                                    : "invalid"
                                }`}
                              >
                                {passwordRules.special
                                  ? "✓"
                                  : "○"}{" "}
                                One special symbol
                              </div>

                            </div>

                          </div>

                        </div>

                      )}

                    </div>

                    {/* CONFIRM PASSWORD */}

                    <div className="mb-4">

                      <label className="form-label fw-semibold">
                        Confirm Password{" "}
                        <span className="text-danger">*</span>
                      </label>

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        className="form-control"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(
                            e.target.value
                          )
                        }
                        placeholder="Re-enter password to confirm"
                        required
                      />

                    </div>

                    {/* BUTTONS */}

                    <div className="d-flex justify-content-end gap-3 pt-3 border-top">

                      <button
                        type="button"
                        className="btn btn-light px-4"
                        onClick={() =>
                          setActiveTab("officers")
                        }
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="btn-main px-5"
                        disabled={
                          loading || !otpVerified
                        }
                      >

                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Creating Account...
                          </>
                        ) : (
                          "Create Staff Account"
                        )}

                      </button>

                    </div>

                  </form>

                </div>

              </div>

            </div>

          )}

          {/* =================================================
              EDIT OFFICER
          ================================================= */}

          {activeTab === "editOfficer" &&
            editingOfficer && (

              <div className="row justify-content-center mb-5">

                <div className="col-12 col-lg-8">

                  <div className="gov-card p-4 p-md-5">

                    <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">

                      <span style={{ fontSize: "28px" }}>
                        ✏️
                      </span>

                      <div>

                        <h4 className="fw-bold text-dark mb-0">
                          Edit Staff #{editingOfficer.id}
                        </h4>

                        <small className="text-muted">
                          Modify staff profile and department.
                        </small>

                      </div>

                    </div>

                    <form onSubmit={updateOfficer}>

                      {/* NAME */}

                      <div className="mb-3">

                        <label className="form-label fw-semibold">
                          Full Name
                        </label>

                        <input
                          type="text"
                          className="form-control"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          required
                        />

                      </div>

                      {/* EMAIL */}

                      <div className="mb-3">

                        <label className="form-label fw-semibold">
                          Email Address
                        </label>

                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />

                      </div>

                      {/* STAFF TYPE */}

                      <div className="mb-3">

                        <label className="form-label fw-semibold">
                          Staff Type
                        </label>

                        <select
                          className="form-select"
                          name="sub_role"
                          value={formData.sub_role}
                          onChange={handleChange}
                        >

                          <option value="municipal">
                            Municipal Officer
                          </option>

                          <option value="department">
                            Department Officer
                          </option>

                        </select>

                      </div>

                      {/* DEPARTMENT */}

                      {formData.sub_role ===
                        "department" && (

                        <div className="mb-3">

                          <label className="form-label fw-semibold">
                            Department{" "}
                            <span className="text-danger">
                              *
                            </span>
                          </label>

                          <select
                            className="form-select"
                            name="department_id"
                            value={
                              formData.department_id
                            }
                            onChange={handleChange}
                            required
                          >

                            <option value="">
                              Select Department
                            </option>

                            {departments.map(
                              (department) => (

                                <option
                                  key={department.id}
                                  value={department.id}
                                >
                                  {
                                    department.department_name
                                  }
                                </option>

                              )
                            )}

                          </select>

                        </div>

                      )}

                      {/* PASSWORD */}

                      <div className="mb-4">

                        <label className="form-label fw-semibold">
                          New Password
                        </label>

                        <div className="input-group-password">

                          <input
                            type={
                              showPassword
                                ? "text"
                                : "password"
                            }
                            className="form-control"
                            name="password"
                            value={
                              formData.password
                            }
                            onChange={handleChange}
                            placeholder="Leave empty to keep existing password"
                          />

                          <button
                            type="button"
                            className="btn-password-toggle"
                            onClick={() =>
                              setShowPassword(
                                !showPassword
                              )
                            }
                          >
                            {showPassword
                              ? "👁️"
                              : "🙈"}
                          </button>

                        </div>

                      </div>

                      <div className="d-flex justify-content-end gap-3 pt-3 border-top">

                        <button
                          type="button"
                          className="btn btn-light px-4"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="btn btn-success text-white fw-bold px-5"
                          disabled={loading}
                        >
                          {loading
                            ? "Saving Changes..."
                            : "Save Changes"}
                        </button>

                      </div>

                    </form>

                  </div>

                </div>

              </div>

            )}

          {/* =================================================
              PETITIONS
          ================================================= */}

          {activeTab === "petitions" && (

            <div className="gov-card overflow-hidden mb-5">

              <div
                className="p-3 text-white d-flex justify-content-between align-items-center"
                style={{ background: "#1E3A8A" }}
              >

                <h5 className="mb-0 fw-bold">
                  All Citizen Complaints
                </h5>

                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={loadPetitions}
                >
                  🔄 Refresh
                </button>

              </div>

              <div className="table-responsive">

                <table className="table gov-table table-hover mb-0">

                  <thead>

                    <tr>
                      <th>ID</th>
                      <th>Citizen</th>
                      <th>Area</th>
                      <th>Category</th>
                      <th>Complaint</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>

                  </thead>

                  <tbody>

                    {petitionLoading ? (

                      <tr>
                        <td
                          colSpan="8"
                          className="text-center py-5"
                        >
                          <div className="spinner-border text-primary" />
                          <p className="mt-2">
                            Loading complaints...
                          </p>
                        </td>
                      </tr>

                    ) : petitions.length === 0 ? (

                      <tr>
                        <td
                          colSpan="8"
                          className="text-center py-5"
                        >
                          📭
                          <p className="mt-2">
                            No complaints registered.
                          </p>
                        </td>
                      </tr>

                    ) : (

                      petitions.map((petition) => (

                        <tr key={petition.id}>

                          <td>
                            #{petition.id}
                          </td>

                          <td>
                            <strong>
                              {petition.citizen_name ||
                                "Unknown"}
                            </strong>

                            <br />

                            <small>
                              {petition.phone || "-"}
                            </small>
                          </td>

                          <td>
                            {petition.area || "-"}
                          </td>

                          <td>

                            <span className="badge bg-primary-subtle text-primary">
                              {petition.category ||
                                "General"}
                            </span>

                          </td>

                          <td
                            style={{
                              maxWidth: "250px",
                            }}
                          >
                            <div
                              className="text-truncate"
                              title={
                                petition.description
                              }
                            >
                              {
                                petition.description
                              }
                            </div>
                          </td>

                          <td>

                            <span
                              className={`badge ${
                                petition.status ===
                                "Resolved"
                                  ? "bg-success"
                                  : petition.status ===
                                    "Rejected"
                                  ? "bg-danger"
                                  : petition.status ===
                                    "In Progress"
                                  ? "bg-primary"
                                  : "bg-warning text-dark"
                              }`}
                            >
                              {petition.status ||
                                "Pending"}
                            </span>

                          </td>

                          <td className="small">

                            {petition.created_at
                              ? new Date(
                                  petition.created_at
                                ).toLocaleDateString(
                                  "en-IN"
                                )
                              : "-"}

                          </td>

                          <td>

                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() =>
                                navigate(
                                  `/petition/${petition.id}`
                                )
                              }
                            >
                              View →
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

          {/* =================================================
              DELETE MODAL
          ================================================= */}

          {officerToDelete && (

            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor:
                  "rgba(15, 23, 42, 0.6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                padding: "20px",
                backdropFilter: "blur(4px)",
              }}
              onClick={() =>
                setOfficerToDelete(null)
              }
            >

              <div
                className="gov-card p-4 p-md-5"
                style={{
                  maxWidth: "480px",
                  width: "100%",
                }}
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <div className="text-center mb-3">

                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: "60px",
                      height: "60px",
                      background: "#FEF2F2",
                      fontSize: "26px",
                    }}
                  >
                    ⚠️
                  </div>

                  <h4 className="fw-bold">
                    Confirm Officer Deletion
                  </h4>

                  <p className="text-muted small">

                    Are you sure you want to delete{" "}
                    <strong>
                      "{officerToDelete.full_name}"
                    </strong>
                    ?

                  </p>

                </div>

                <div className="d-flex justify-content-center gap-3">

                  <button
                    type="button"
                    className="btn btn-light px-4"
                    onClick={() =>
                      setOfficerToDelete(null)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger px-4"
                    onClick={confirmDeleteOfficer}
                    disabled={loading}
                  >
                    {loading
                      ? "Deleting..."
                      : "Yes, Delete Officer"}
                  </button>

                </div>

              </div>

            </div>

          )}

        </div>

      </main>

      <Footer />

    </div>
  );
}

export default AdminDashboard;