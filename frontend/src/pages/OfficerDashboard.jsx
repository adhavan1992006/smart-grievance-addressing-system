import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const API_BASE_URL = "https://smart-grievance-backend-b6ow.onrender.com/api";

function OfficerDashboard() {
  const navigate = useNavigate();

  // ==============================
  // OFFICER
  // ==============================

  const officer = JSON.parse(
    sessionStorage.getItem("officer") || "{}"
  );

  const isMunicipalOfficer =
    String(officer?.sub_role || "").toLowerCase() === "municipal" ||
    String(officer?.officer_type || "").toLowerCase() === "municipal";

  // ==============================
  // TIME PERIOD
  // ==============================

  const [period, setPeriod] = useState("monthly");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ==============================
  // FILTERS
  // ==============================

  const [filterDept, setFilterDept] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // ==============================
  // RECENT PETITIONS
  // ==============================

  const [deptPetitions, setDeptPetitions] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);

  // ==============================
  // ANALYTICS
  // ==============================

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // ==============================
  // FETCH RECENT PETITIONS
  // ==============================

  useEffect(() => {
    fetchRecentPetitions();
  }, []);

  // ==============================
  // FETCH ANALYTICS
  // IMPORTANT:
  // Added fromDate + toDate dependencies
  // ==============================

  useEffect(() => {
    if (isMunicipalOfficer) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [
    period,
    fromDate,
    toDate,
    filterDept,
    filterCategory,
    filterArea,
    filterStatus,
    filterPriority,
    isMunicipalOfficer,
  ]);

  // ==============================
  // FETCH RECENT PETITIONS
  // ==============================

  const fetchRecentPetitions = async () => {
    try {
      setDeptLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/officer/petitions`
      );

      console.log("Recent petitions response:", response.data);

      if (response.data?.success) {
        setDeptPetitions(response.data.petitions || []);
      } else {
        setDeptPetitions([]);
      }
    } catch (error) {
      console.error(
        "Recent petitions fetch error:",
        error
      );

      setDeptPetitions([]);
    } finally {
      setDeptLoading(false);
    }
  };

  // ==============================
  // FETCH ANALYTICS
  // ==============================

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      let url = `${API_BASE_URL}/officer/analytics`;

      const params = new URLSearchParams();

      params.append("period", period);

      if (fromDate && toDate) {
        params.append("from", fromDate);
        params.append("to", toDate);
      }

      if (filterDept) {
        params.append(
          "department",
          filterDept
        );
      }

      if (filterCategory) {
        params.append(
          "category",
          filterCategory
        );
      }

      if (filterArea) {
        params.append(
          "area",
          filterArea
        );
      }

      if (filterStatus) {
        params.append(
          "status",
          filterStatus
        );
      }

      if (filterPriority) {
        params.append(
          "priority",
          filterPriority
        );
      }

      url += `?${params.toString()}`;

      console.log(
        "Analytics API:",
        url
      );

      const response = await axios.get(url);

      console.log(
        "Analytics response:",
        response.data
      );

      if (response.data?.success) {
        setAnalytics(response.data);
      } else {
        setAnalytics(null);

        setErrorMsg(
          response.data?.message ||
            "Failed to load analytics data."
        );
      }
    } catch (error) {
      console.error(
        "Analytics fetch error:",
        error
      );

      setAnalytics(null);

      if (error.response) {
        setErrorMsg(
          error.response.data?.message ||
            `Server error: ${error.response.status}`
        );
      } else if (error.request) {
        setErrorMsg(
          "Cannot connect to backend server. Make sure your Node.js server is running on port 5000."
        );
      } else {
        setErrorMsg(
          "Unable to load analytics data."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // RESET FILTERS
  // ==============================

  const handleResetFilters = () => {
    setPeriod("monthly");

    setFromDate("");
    setToDate("");

    setFilterDept("");
    setFilterCategory("");
    setFilterArea("");
    setFilterStatus("");
    setFilterPriority("");
  };

  // ==============================
  // LOGOUT
  // ==============================

  const handleLogout = () => {
    sessionStorage.removeItem("officer");
    sessionStorage.removeItem("officerToken");

    navigate("/officer-login");
  };

  // ==============================
  // CSV EXPORT
  // ==============================

  const exportAnalyticsReport = () => {
    if (!analytics) {
      alert("Analytics data is not available.");
      return;
    }

    const kpi = analytics.kpi || {};

    const rows = [
      [
        "Smart Grievance System - Municipal Analytics Report",
      ],

      [
        "Generated At",
        new Date().toLocaleString(),
      ],

      [
        "Evaluation Period",
        period.toUpperCase(),
      ],

      [],

      [
        "Metric Name",
        "Value",
      ],

      [
        "Total Complaints Received",
        kpi.total || 0,
      ],

      [
        "New / Pending Complaints",
        kpi.pending || 0,
      ],

      [
        "Under Review",
        kpi.under_review || 0,
      ],

      [
        "In Progress",
        kpi.in_progress || 0,
      ],

      [
        "Resolved Complaints",
        kpi.resolved || 0,
      ],

      [
        "Rejected Complaints",
        kpi.rejected || 0,
      ],

      [
        "Overdue SLA Complaints",
        kpi.overdue || 0,
      ],

      [
        "Resolution Rate (%)",
        `${kpi.resolution_rate || 0}%`,
      ],

      [
        "SLA Compliance Rate (%)",
        `${kpi.sla_compliance_rate || 0}%`,
      ],

      [],

      [
        "Category Breakdown",
      ],

      [
        "Category",
        "Complaint Count",
        "Percentage",
      ],

      ...(analytics.categories || []).map(
        (item) => [
          item.category,
          item.count || 0,
          `${item.percentage || 0}%`,
        ]
      ),

      [],

      [
        "Top Locality / Area Breakdown",
      ],

      [
        "Area / Locality",
        "Complaint Count",
        "Percentage",
      ],

      ...(analytics.areas || []).map(
        (item) => [
          item.area,
          item.count || 0,
          `${item.percentage || 0}%`,
        ]
      ),

      [],

      [
        "Department Workload Breakdown",
      ],

      [
        "Department",
        "Total Assigned",
        "Resolved",
        "Pending",
        "In Progress",
        "Overdue",
      ],

      ...(analytics.department_workload || []).map(
        (item) => [
          item.department,
          item.assigned || 0,
          item.resolved || 0,
          item.pending || 0,
          item.in_progress || 0,
          item.overdue || 0,
        ]
      ),
    ];

    // Proper CSV escaping
    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(
              value ?? ""
            );

            return `"${text.replace(
              /"/g,
              '""'
            )}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = `Grievance_Analytics_${period}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ==============================
  // PIE COLORS
  // ==============================

  const COLORS = [
    "#1E3A8A",
    "#2563EB",
    "#059669",
    "#D97706",
    "#DC2626",
  ];

  // ==============================
  // KPI
  // ==============================

  const kpi = analytics?.kpi || {};

  // ==============================
  // PIE DATA
  // ==============================

  const statusData = [
    {
      name: "Resolved",
      value: Number(kpi.resolved || 0),
    },

    {
      name: "In Progress",
      value: Number(
        kpi.in_progress || 0
      ),
    },

    {
      name: "Pending",
      value: Number(kpi.pending || 0),
    },

    {
      name: "Under Review",
      value: Number(
        kpi.under_review || 0
      ),
    },

    {
      name: "Rejected",
      value: Number(kpi.rejected || 0),
    },
  ];

  // ==============================
  // RENDER
  // ==============================

  return (
    <div className="page-wrapper">

      <Navbar />

      <main className="page-content">

        <div className="container py-4">

          {/* =====================================================
              OFFICER HEADER
          ===================================================== */}

          <div
            className="card border-0 shadow-sm mb-4 text-white p-4"
            style={{
              background:
                "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",

              borderRadius: "16px",
            }}
          >

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

              <div>

                <span className="badge bg-light text-primary fw-bold mb-2 px-3 py-2">
                  Municipal Command &amp; Control Center
                </span>

                <h2 className="fw-bold mb-1">

                  Welcome,{" "}

                  {officer?.full_name ||
                    "Municipal Officer"}

                  {" "}👮

                </h2>

                <p className="mb-0 text-white-50">

                  Municipal officers manage citizen
                  grievances and route them to the
                  appropriate government departments.

                </p>

              </div>

              <div className="d-flex flex-wrap gap-2">

                <button
                  className="btn btn-light text-primary fw-semibold px-4"
                  onClick={() =>
                    navigate(
                      "/officer-petitions"
                    )
                  }
                >
                  📋 View All Complaints
                </button>

                <button
                  className="btn btn-outline-light px-3"
                  onClick={handleLogout}
                >
                  Logout
                </button>

              </div>

            </div>

            <div className="mt-4 pt-3 d-flex flex-wrap gap-4 border-top border-white border-opacity-25 small">

              <div>

                <span className="text-white-50">
                  Logged Officer:{" "}
                </span>

                <strong>
                  {officer?.full_name ||
                    "Officer"}
                </strong>

              </div>

              <div>

                <span className="text-white-50">
                  Role:{" "}
                </span>

                <span className="badge bg-warning text-dark fw-bold ms-1">
                  Municipal Grievance Officer
                </span>

              </div>

              <div>

                <span className="text-white-50">
                  Region:{" "}
                </span>

                <strong>
                  Madurai Municipal Corporation
                </strong>

              </div>

            </div>

          </div>


          {/* =====================================================
              RECENT COMPLAINTS
          ===================================================== */}

          <div className="gov-card p-4 mb-5 border-start border-4 border-primary">

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">

              <div>

                <h5 className="fw-bold text-dark mb-1">

                  🏢 Recent Citizen Complaints (
                  {deptPetitions.length}
                  )

                </h5>

                <p className="text-muted small mb-0">

                  Recent grievances submitted by citizens
                  requiring assignment or review.

                </p>

              </div>

              <button
                className="btn btn-sm btn-outline-primary fw-semibold"
                onClick={() =>
                  navigate(
                    "/officer-petitions"
                  )
                }
              >
                View Full List →
              </button>

            </div>


            {deptLoading ? (

              <div className="text-center py-4 text-muted">

                <span className="spinner-border spinner-border-sm me-2" />

                Loading complaints...

              </div>

            ) : deptPetitions.length === 0 ? (

              <div className="p-3 bg-light rounded text-center text-muted">

                📌 No complaints currently available.

              </div>

            ) : (

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead className="table-light">

                    <tr>

                      <th>ID</th>

                      <th>CATEGORY</th>

                      <th>LOCATION</th>

                      <th>SUBMITTED DATE</th>

                      <th>STATUS</th>

                      <th className="text-center">
                        ACTION
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {deptPetitions
                      .slice(0, 5)
                      .map((pet) => (

                        <tr key={pet.id}>

                          <td>
                            <strong>
                              #{pet.id}
                            </strong>
                          </td>

                          <td>

                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">

                              {pet.category ||
                                "No Category"}

                            </span>

                          </td>

                          <td className="small">

                            {pet.area ||
                              pet.street ||
                              pet.location ||
                              "Location unavailable"}

                            {(pet.area ||
                              pet.street ||
                              pet.location) &&
                              ", Madurai"}

                          </td>

                          <td className="small text-muted">

                            {pet.created_at
                              ? new Date(
                                  pet.created_at
                                ).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "N/A"}

                          </td>

                          <td>

                            <span
                              className={`badge ${
                                pet.status ===
                                "Resolved"
                                  ? "bg-success"
                                  : pet.status ===
                                    "In Progress"
                                  ? "bg-primary"
                                  : pet.status ===
                                    "Rejected"
                                  ? "bg-danger"
                                  : pet.status ===
                                    "Under Review"
                                  ? "bg-info text-dark"
                                  : "bg-warning text-dark"
                              }`}
                            >

                              {pet.status ||
                                "Pending"}

                            </span>

                          </td>

                          <td className="text-center">

                            <button
                              className="btn btn-sm btn-outline-primary fw-semibold"
                              onClick={() =>
                                navigate(
                                  `/petition/${pet.id}`
                                )
                              }
                            >
                              Details →
                            </button>

                          </td>

                        </tr>

                      ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>


          {/* =====================================================
              ANALYTICS FILTERS (MUNICIPAL OFFICER ONLY)
          ===================================================== */}

          {isMunicipalOfficer && (
            <>
              <div className="gov-card p-4 mb-4">

            <div className="d-flex flex-column gap-3">


              {/* TIME PERIOD */}

              <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 pb-3 border-bottom">

                <div>

                  <label className="fw-bold text-dark d-block mb-2">
                    Analytics Timeframe
                  </label>

                  <div className="btn-group">

                    {[
                      "weekly",
                      "monthly",
                      "yearly",
                    ].map((item) => (

                      <button
                        key={item}
                        type="button"
                        className={`btn fw-bold px-4 ${
                          period === item
                            ? "btn-primary"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() =>
                          setPeriod(item)
                        }
                      >
                        {item.toUpperCase()}
                      </button>

                    ))}

                  </div>

                </div>


                <button
                  className="btn btn-success fw-semibold px-4"
                  onClick={
                    exportAnalyticsReport
                  }
                  disabled={!analytics}
                >
                  📥 Export Report
                </button>

              </div>


              {/* DATE FILTER */}

              <div className="row g-2">

                <div className="col-md-3">

                  <label className="form-label small fw-bold">
                    From Date
                  </label>

                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={fromDate}
                    onChange={(e) =>
                      setFromDate(
                        e.target.value
                      )
                    }
                  />

                </div>


                <div className="col-md-3">

                  <label className="form-label small fw-bold">
                    To Date
                  </label>

                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) =>
                      setToDate(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>


              {/* FILTERS */}

              <div className="row g-2">


                {/* DEPARTMENT */}

                <div className="col-6 col-md-4 col-lg-2">

                  <label className="form-label small fw-bold mb-1">
                    Department
                  </label>

                  <select
                    className="form-select form-select-sm"
                    value={filterDept}
                    onChange={(e) =>
                      setFilterDept(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      All Departments
                    </option>

                    <option value="Water Supply Department">
                      Water Supply Department
                    </option>

                    <option value="Roads & Highways Department">
                      Roads &amp; Highways Department
                    </option>

                    <option value="Electrical Department">
                      Electrical Department
                    </option>

                    <option value="Sanitation Department">
                      Sanitation Department
                    </option>

                    <option value="Drainage & Sewerage Department">
                      Drainage &amp; Sewerage Department
                    </option>

                    <option value="Public Health Department">
                      Public Health Department
                    </option>

                    <option value="Parks & Environment Department">
                      Parks &amp; Environment Department
                    </option>

                    <option value="General Administration Department">
                      General Administration Department
                    </option>

                  </select>

                </div>


                {/* CATEGORY */}

                <div className="col-6 col-md-4 col-lg-2">

                  <label className="form-label small fw-bold mb-1">
                    Category
                  </label>

                  <select
                    className="form-select form-select-sm"
                    value={filterCategory}
                    onChange={(e) =>
                      setFilterCategory(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      All Categories
                    </option>

                    {(
                      analytics?.categories ||
                      []
                    ).map((item) => (

                      <option
                        key={item.category}
                        value={item.category}
                      >
                        {item.category}
                      </option>

                    ))}

                  </select>

                </div>


                {/* AREA */}

                <div className="col-6 col-md-4 col-lg-2">

                  <label className="form-label small fw-bold mb-1">
                    Area / Locality
                  </label>

                  <select
                    className="form-select form-select-sm"
                    value={filterArea}
                    onChange={(e) =>
                      setFilterArea(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      All Areas
                    </option>

                    {(
                      analytics?.areas ||
                      []
                    ).map((item) => (

                      <option
                        key={item.area}
                        value={item.area}
                      >
                        {item.area}
                      </option>

                    ))}

                  </select>

                </div>


                {/* STATUS */}

                <div className="col-6 col-md-4 col-lg-2">

                  <label className="form-label small fw-bold mb-1">
                    Status
                  </label>

                  <select
                    className="form-select form-select-sm"
                    value={filterStatus}
                    onChange={(e) =>
                      setFilterStatus(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      All Statuses
                    </option>

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Under Review">
                      Under Review
                    </option>

                    <option value="In Progress">
                      In Progress
                    </option>

                    <option value="Resolved">
                      Resolved
                    </option>

                    <option value="Rejected">
                      Rejected
                    </option>

                  </select>

                </div>


                {/* PRIORITY */}

                <div className="col-6 col-md-4 col-lg-2">

                  <label className="form-label small fw-bold mb-1">
                    Priority
                  </label>

                  <select
                    className="form-select form-select-sm"
                    value={filterPriority}
                    onChange={(e) =>
                      setFilterPriority(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      All Priorities
                    </option>

                    <option value="CRITICAL">
                      CRITICAL
                    </option>

                    <option value="HIGH">
                      HIGH
                    </option>

                    <option value="MEDIUM">
                      MEDIUM
                    </option>

                    <option value="LOW">
                      LOW
                    </option>

                  </select>

                </div>


                {/* RESET */}

                <div className="col-6 col-md-4 col-lg-2">

                  <label className="form-label small fw-bold mb-1">
                    &nbsp;
                  </label>

                  <button
                    className="btn btn-sm btn-outline-secondary w-100"
                    onClick={
                      handleResetFilters
                    }
                  >
                    🔄 Reset
                  </button>

                </div>

              </div>

            </div>


            {/* ERROR */}

            {errorMsg && (

              <div className="alert alert-danger mt-3 mb-0">

                <strong>
                  ⚠️ Analytics Error:
                </strong>

                <br />

                {errorMsg}

              </div>

            )}

          </div>


          {/* =====================================================
              LOADING
          ===================================================== */}

          {loading && (

            <div className="text-center py-5">

              <div
                className="spinner-border text-primary"
                role="status"
              />

              <p className="mt-3 text-muted">
                Aggregating database analytics...
              </p>

            </div>

          )}


          {/* =====================================================
              ANALYTICS
          ===================================================== */}

          {!loading && analytics && (

            <>

              {/* =================================================
                  KPI TITLE
              ================================================= */}

              <h5 className="fw-bold text-dark mb-3">
                📊 Key Operational Metrics
              </h5>


              {/* =================================================
                  KPI CARDS
              ================================================= */}

              <div className="row g-3 mb-4">


                {/* TOTAL */}

                <div className="col-6 col-md-4 col-lg">

                  <div className="gov-card p-3 text-center border-start border-4 border-primary h-100">

                    <small className="text-muted fw-bold d-block">
                      TOTAL RECEIVED
                    </small>

                    <h3 className="fw-bold text-dark mb-0 mt-1">
                      {kpi.total || 0}
                    </h3>

                    <small className="text-primary fw-semibold">
                      100% Volume
                    </small>

                  </div>

                </div>


                {/* PENDING */}

                <div className="col-6 col-md-4 col-lg">

                  <div className="gov-card p-3 text-center border-start border-4 border-warning h-100">

                    <small className="text-muted fw-bold d-block">
                      NEW / PENDING
                    </small>

                    <h3 className="fw-bold text-warning mb-0 mt-1">
                      {kpi.pending || 0}
                    </h3>

                    <small className="text-muted">
                      Awaiting Action
                    </small>

                  </div>

                </div>


                {/* UNDER REVIEW */}

                <div className="col-6 col-md-4 col-lg">

                  <div className="gov-card p-3 text-center border-start border-4 border-info h-100">

                    <small className="text-muted fw-bold d-block">
                      UNDER REVIEW
                    </small>

                    <h3 className="fw-bold text-info mb-0 mt-1">
                      {kpi.under_review || 0}
                    </h3>

                    <small className="text-muted">
                      Field Dispatched
                    </small>

                  </div>

                </div>


                {/* IN PROGRESS */}

                <div className="col-6 col-md-4 col-lg">

                  <div className="gov-card p-3 text-center border-start border-4 border-primary h-100">

                    <small className="text-muted fw-bold d-block">
                      IN PROGRESS
                    </small>

                    <h3 className="fw-bold text-primary mb-0 mt-1">
                      {kpi.in_progress || 0}
                    </h3>

                    <small className="text-muted">
                      Active Work
                    </small>

                  </div>

                </div>


                {/* RESOLVED */}

                <div className="col-6 col-md-4 col-lg">

                  <div className="gov-card p-3 text-center border-start border-4 border-success h-100">

                    <small className="text-muted fw-bold d-block">
                      RESOLVED
                    </small>

                    <h3 className="fw-bold text-success mb-0 mt-1">
                      {kpi.resolved || 0}
                    </h3>

                    <small className="text-success fw-bold">
                      {kpi.resolution_rate || 0}%
                      Rate
                    </small>

                  </div>

                </div>


                {/* REJECTED */}

                <div className="col-6 col-md-4 col-lg">

                  <div className="gov-card p-3 text-center border-start border-4 border-danger h-100">

                    <small className="text-muted fw-bold d-block">
                      REJECTED
                    </small>

                    <h3 className="fw-bold text-danger mb-0 mt-1">
                      {kpi.rejected || 0}
                    </h3>

                    <small className="text-muted">
                      Closed / Invalid
                    </small>

                  </div>

                </div>


                {/* OVERDUE */}

                <div className="col-6 col-md-4 col-lg">

                  <div className="gov-card p-3 text-center border-start border-4 border-danger bg-danger-subtle h-100">

                    <small className="text-danger fw-bold d-block">
                      OVERDUE SLA
                    </small>

                    <h3 className="fw-bold text-danger mb-0 mt-1">
                      {kpi.overdue || 0}
                    </h3>

                    <small className="text-danger fw-bold">
                      SLA Breached
                    </small>

                  </div>

                </div>


                {/* SLA */}

                <div className="col-6 col-md-4 col-lg">

                  <div className="gov-card p-3 text-center border-start border-4 border-success h-100">

                    <small className="text-muted fw-bold d-block">
                      SLA COMPLIANCE
                    </small>

                    <h3 className="fw-bold text-success mb-0 mt-1">
                      {kpi.sla_compliance_rate || 0}%
                    </h3>

                    <small className="text-muted">
                      Within Deadline
                    </small>

                  </div>

                </div>


                {/* AVG RESOLUTION */}

                <div className="col-6 col-md-4 col-lg">

                  <div className="gov-card p-3 text-center border-start border-4 border-secondary h-100">

                    <small className="text-muted fw-bold d-block">
                      AVG RESOLUTION
                    </small>

                    <h3 className="fw-bold text-dark mb-0 mt-1">

                      {kpi.avg_resolution_hours ||
                        0}
                      h

                    </h3>

                    <small className="text-muted">
                      Turnaround Benchmark
                    </small>

                  </div>

                </div>

              </div>


              {/* =================================================
                  CATEGORY + DEPARTMENT
              ================================================= */}

              <div className="row g-4 mb-4">


                {/* CATEGORY */}

                <div className="col-lg-6">

                  <div className="gov-card p-4 h-100">

                    <h5 className="fw-bold text-dark mb-1">
                      📋 Category Breakdown Analysis
                    </h5>

                    <p className="text-muted small mb-3">
                      Distribution of grievances across
                      municipal service categories.
                    </p>

                    <div
                      style={{
                        width: "100%",
                        height: 300,
                      }}
                    >

                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >

                        <BarChart
                          data={
                            analytics.categories ||
                            []
                          }
                          layout="vertical"
                          margin={{
                            left: 20,
                            right: 20,
                            top: 5,
                            bottom: 5,
                          }}
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                          />

                          <XAxis
                            type="number"
                            allowDecimals={false}
                          />

                          <YAxis
                            dataKey="category"
                            type="category"
                            width={130}
                            tick={{
                              fontSize: 11,
                            }}
                          />

                          <Tooltip />

                          <Bar
                            dataKey="count"
                            fill="#1E3A8A"
                            radius={[
                              0,
                              4,
                              4,
                              0,
                            ]}
                            name="Complaints"
                          />

                        </BarChart>

                      </ResponsiveContainer>

                    </div>

                  </div>

                </div>


                {/* DEPARTMENT */}

                <div className="col-lg-6">

                  <div className="gov-card p-4 h-100">

                    <h5 className="fw-bold text-dark mb-1">
                      🏢 Government Department Analytics
                    </h5>

                    <p className="text-muted small mb-3">
                      Complaints routed and managed by
                      official municipal departments.
                    </p>

                    <div className="table-responsive">

                      <table className="table table-hover align-middle mb-0">

                        <thead className="table-light">

                          <tr>

                            <th>
                              Department
                            </th>

                            <th>
                              Total
                            </th>

                            <th>
                              Resolved
                            </th>

                            <th>
                              Pending
                            </th>

                            <th>
                              Overdue
                            </th>

                          </tr>

                        </thead>

                        <tbody>

                          {(
                            analytics.department_workload ||
                            []
                          ).length === 0 ? (

                            <tr>

                              <td
                                colSpan="5"
                                className="text-center py-4 text-muted"
                              >
                                No department assignments
                                logged yet.
                              </td>

                            </tr>

                          ) : (

                            (
                              analytics.department_workload ||
                              []
                            ).map((dept) => (

                              <tr
                                key={
                                  dept.department
                                }
                              >

                                <td>
                                  <strong className="text-dark">
                                    {
                                      dept.department
                                    }
                                  </strong>
                                </td>

                                <td>

                                  <span className="badge bg-primary">
                                    {dept.assigned ||
                                      0}
                                  </span>

                                </td>

                                <td className="text-success fw-bold">
                                  {dept.resolved ||
                                    0}
                                </td>

                                <td className="text-warning-emphasis fw-bold">
                                  {dept.pending ||
                                    0}
                                </td>

                                <td>

                                  {Number(
                                    dept.overdue || 0
                                  ) > 0 ? (

                                    <span className="badge bg-danger">

                                      🔴{" "}
                                      {
                                        dept.overdue
                                      }{" "}
                                      Overdue

                                    </span>

                                  ) : (

                                    <span className="badge bg-light text-muted border">
                                      0
                                    </span>

                                  )}

                                </td>

                              </tr>

                            ))

                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>

                </div>

              </div>


              {/* =================================================
                  AREA + STATUS
              ================================================= */}

              <div className="row g-4 mb-4">


                {/* AREA */}

                <div className="col-lg-7">

                  <div className="gov-card p-4 h-100">

                    <h5 className="fw-bold text-dark mb-1">
                      📍 Top Problem Areas
                    </h5>

                    <p className="text-muted small mb-3">
                      Neighborhoods with highest
                      complaint volume.
                    </p>

                    <div className="table-responsive">

                      <table className="table table-hover align-middle mb-0">

                        <thead className="table-light">

                          <tr>

                            <th>
                              Rank
                            </th>

                            <th>
                              Locality / Ward
                            </th>

                            <th>
                              Complaints
                            </th>

                            <th>
                              Share
                            </th>

                          </tr>

                        </thead>

                        <tbody>

                          {(
                            analytics.areas ||
                            []
                          ).length === 0 ? (

                            <tr>

                              <td
                                colSpan="4"
                                className="text-center py-4 text-muted"
                              >
                                No area data available.
                              </td>

                            </tr>

                          ) : (

                            (
                              analytics.areas ||
                              []
                            ).map(
                              (item, index) => (

                                <tr
                                  key={
                                    item.area
                                  }
                                >

                                  <td>
                                    <strong>
                                      #{index + 1}
                                    </strong>
                                  </td>

                                  <td className="fw-semibold text-dark">

                                    {index === 0
                                      ? "🔥 "
                                      : index === 1
                                      ? "🟠 "
                                      : "🟢 "}

                                    {item.area}

                                  </td>

                                  <td>

                                    <span className="badge bg-primary">
                                      {item.count ||
                                        0}
                                    </span>

                                  </td>

                                  <td>

                                    <div className="d-flex align-items-center gap-2">

                                      <div
                                        className="progress flex-grow-1"
                                        style={{
                                          height:
                                            "6px",
                                          minWidth:
                                            "60px",
                                        }}
                                      >

                                        <div
                                          className="progress-bar bg-primary"
                                          style={{
                                            width: `${Math.min(
                                              Number(
                                                item.percentage ||
                                                  0
                                              ),
                                              100
                                            )}%`,
                                          }}
                                        />

                                      </div>

                                      <small className="fw-bold">
                                        {item.percentage ||
                                          0}
                                        %
                                      </small>

                                    </div>

                                  </td>

                                </tr>

                              )
                            )

                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>

                </div>


                {/* STATUS */}

                <div className="col-lg-5">

                  <div className="gov-card p-4 h-100">

                    <h5 className="fw-bold text-dark mb-1">
                      📊 Status Distribution
                    </h5>

                    <p className="text-muted small mb-3">
                      Overall grievance status
                      percentage breakdown.
                    </p>

                    <div
                      style={{
                        width: "100%",
                        height: 280,
                      }}
                    >

                      {statusData.some(
                        (item) =>
                          item.value > 0
                      ) ? (

                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >

                          <PieChart>

                            <Pie
                              data={statusData}
                              cx="50%"
                              cy="45%"
                              innerRadius={55}
                              outerRadius={90}
                              paddingAngle={3}
                              dataKey="value"
                            >

                              {statusData.map(
                                (
                                  entry,
                                  index
                                ) => (

                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      COLORS[
                                        index %
                                          COLORS.length
                                      ]
                                    }
                                  />

                                )
                              )}

                            </Pie>

                            <Tooltip />

                            <Legend />

                          </PieChart>

                        </ResponsiveContainer>

                      ) : (

                        <div className="h-100 d-flex align-items-center justify-content-center text-muted">

                          No status data available.

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              </div>


              {/* =================================================
                  INSIGHTS
              ================================================= */}

              <div className="gov-card p-4 mb-5 border-start border-4 border-primary">

                <h5 className="fw-bold text-dark mb-3">
                  💡 Key System Insights &amp;
                  Operational Intelligence
                </h5>

                <div className="row g-3">

                  {(
                    analytics.insights ||
                    []
                  ).length === 0 ? (

                    <div className="col-12">

                      <div className="p-3 bg-light rounded border text-muted small">
                        No insights available for
                        the selected filters.
                      </div>

                    </div>

                  ) : (

                    (
                      analytics.insights ||
                      []
                    ).map(
                      (text, index) => (

                        <div
                          key={index}
                          className="col-md-6"
                        >

                          <div className="p-3 bg-light rounded-3 d-flex align-items-start gap-3 border">

                            <span
                              style={{
                                fontSize:
                                  "20px",
                              }}
                            >
                              ℹ️
                            </span>

                            <div className="small fw-semibold text-secondary">
                              {text}
                            </div>

                          </div>

                        </div>

                      )
                    )

                  )}

                </div>

              </div>

            </>

          )}

            </>

          )}


          {/* =====================================================
              ADMINISTRATIVE MODULES
          ===================================================== */}

          {isMunicipalOfficer && (
            <>
              <h5 className="fw-bold text-dark mb-3">
                🗂️ Administrative Modules
              </h5>


              <div className="row g-4 mb-5">


                {/* PETITIONS */}

                <div className="col-md-6 col-lg-3">

                  <div
                    className="gov-card h-100 p-4 d-flex flex-column text-center align-items-center"
                    style={{
                      cursor:
                        "pointer",
                    }}
                    onClick={() =>
                      navigate(
                        "/officer-petitions"
                      )
                    }
                  >

                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                      style={{
                        width:
                          "60px",
                        height:
                          "60px",
                        background:
                          "#EFF6FF",
                        fontSize:
                          "26px",
                      }}
                    >
                      📋
                    </div>

                    <h5 className="fw-bold text-dark mb-2">
                      Petitions List
                    </h5>

                    <p className="text-muted small flex-grow-1">
                      Browse all citizen petitions
                      with status filters.
                    </p>

                    <button className="btn btn-outline-primary w-100 mt-2 fw-semibold">
                      Open Petitions →
                    </button>

                  </div>

                </div>


                {/* PROBLEM PRIORITY */}

                <div className="col-md-6 col-lg-3">

                  <div
                    className="gov-card h-100 p-4 d-flex flex-column text-center align-items-center"
                    style={{
                      cursor:
                        "pointer",
                    }}
                    onClick={() =>
                      navigate(
                        "/officer-problem-priority"
                      )
                    }
                  >

                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                      style={{
                        width:
                          "60px",
                        height:
                          "60px",
                        background:
                          "#FEF3C7",
                        fontSize:
                          "26px",
                      }}
                    >
                      📊
                    </div>

                    <h5 className="fw-bold text-dark mb-2">
                      Problem Priority
                    </h5>

                    <p className="text-muted small flex-grow-1">
                      AI-driven problem frequency
                      and severity rankings.
                    </p>

                    <button className="btn btn-outline-warning text-dark w-100 mt-2 fw-semibold">
                      Problem Ranking →
                    </button>

                  </div>

                </div>


                {/* AREA PRIORITY */}

                <div className="col-md-6 col-lg-3">

                  <div
                    className="gov-card h-100 p-4 d-flex flex-column text-center align-items-center"
                    style={{
                      cursor:
                        "pointer",
                    }}
                    onClick={() =>
                      navigate(
                        "/officer-area-priority"
                      )
                    }
                  >

                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                      style={{
                        width:
                          "60px",
                        height:
                          "60px",
                        background:
                          "#FCE7F3",
                        fontSize:
                          "26px",
                      }}
                    >
                      📍
                    </div>

                    <h5 className="fw-bold text-dark mb-2">
                      Priority by Area
                    </h5>

                    <p className="text-muted small flex-grow-1">
                      Zonal breakdown of
                      high-impact complaint
                      localities.
                    </p>

                    <button className="btn btn-outline-danger w-100 mt-2 fw-semibold">
                      Area Priority →
                    </button>

                  </div>

                </div>


                {/* MAP */}

                <div className="col-md-6 col-lg-3">

                  <div
                    className="gov-card h-100 p-4 d-flex flex-column text-center align-items-center"
                    style={{
                      cursor:
                        "pointer",
                    }}
                    onClick={() =>
                      navigate(
                        "/officer-map"
                      )
                    }
                  >

                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                      style={{
                        width:
                          "60px",
                        height:
                          "60px",
                        background:
                          "#ECFDF5",
                        fontSize:
                          "26px",
                      }}
                    >
                      🗺️
                    </div>

                    <h5 className="fw-bold text-dark mb-2">
                      Complaint Map
                    </h5>

                    <p className="text-muted small flex-grow-1">
                      Interactive Leaflet map
                      displaying complaint markers.
                    </p>

                    <button className="btn btn-outline-success w-100 mt-2 fw-semibold">
                      Launch Map →
                    </button>

                  </div>

                </div>

              </div>

            </>
          )}

        </div>

      </main>

      <Footer />

    </div>
  );
}

export default OfficerDashboard;