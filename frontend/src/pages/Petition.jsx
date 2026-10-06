import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CitizenFeedback from "../components/CitizenFeedback";

function Petition() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [petition, setPetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const [inlineAlert, setInlineAlert] = useState(null); // { type: 'success' | 'danger', text: '' }

  // --- Department Assignment state (Aligned with database departments table) ---
  const DEPARTMENTS = [
    "Water Supply Department",
    "Roads & Highways Department",
    "Electrical Department",
    "Sanitation Department",
    "Drainage & Sewerage Department",
    "Public Health Department",
    "Parks & Environment Department",
    "General Administration Department"
  ];

  // Auto-map AI category → recommended department (Database aligned)
  const getRecommendedDepartment = (category) => {
    if (!category) return "General Administration Department";
    const cat = category.toLowerCase();
    if (cat.includes("water"))
      return "Water Supply Department";
    if (cat.includes("road") || cat.includes("pothole"))
      return "Roads & Highways Department";
    if (cat.includes("street light") || cat.includes("lamp") || cat.includes("electricity") || cat.includes("power"))
      return "Electrical Department";
    if (cat.includes("garbage") || cat.includes("trash") || cat.includes("waste") || cat.includes("toilet") || cat.includes("sanitation") || cat.includes("dumping"))
      return "Sanitation Department";
    if (cat.includes("drainage") || cat.includes("sewage"))
      return "Drainage & Sewerage Department";
    if (cat.includes("health") || cat.includes("hospital") || cat.includes("epidemic"))
      return "Public Health Department";
    if (cat.includes("tree") || cat.includes("park") || cat.includes("animal") || cat.includes("environment"))
      return "Parks & Environment Department";
    return "General Administration Department";
  };

  const [assignDept, setAssignDept] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignAlert, setAssignAlert] = useState(null);

  // Pre-populate assignment dropdown once petition is loaded
  useEffect(() => {
    if (petition) {
      setAssignDept(petition.assigned_department || getRecommendedDepartment(petition.category));
    }
  }, [petition]);

  const saveAssignment = async () => {
    if (!assignDept) {
      setAssignAlert({ type: "danger", text: "Please select a department first." });
      return;
    }
    try {
      setAssigning(true);
      setAssignAlert(null);
      const res = await axios.put(
        `http://localhost:5000/api/officer/petition/${id}/assign`,
        {
          assigned_department: assignDept,
        }
      );
      if (res.data.success) {
        setPetition((prev) => ({
          ...prev,
          assigned_department: res.data.assigned_department,
        }));
        setAssignAlert({
          type: "success",
          text: `✓ Assigned to ${res.data.assigned_department}`,
        });
      }
    } catch (e) {
      console.error("Assignment error:", e);
      setAssignAlert({ type: "danger", text: "Failed to save department assignment. Please try again." });
    } finally {
      setAssigning(false);
    }
  };



  // Check if officer or admin
  const isOfficerOrAdmin = Boolean(
    sessionStorage.getItem("officerToken") || sessionStorage.getItem("adminToken")
  );

  const officer = JSON.parse(
    sessionStorage.getItem("officer") || "{}"
  );

  const isMunicipalOfficer =
    String(officer?.sub_role || "").toLowerCase() === "municipal" ||
    String(officer?.officer_type || "").toLowerCase() === "municipal";

  const isDepartmentOfficer =
    String(officer?.sub_role || "").toLowerCase() === "department" ||
    String(officer?.officer_type || "").toLowerCase() === "department";

  useEffect(() => {
    const fetchPetition = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/officer/petition/${id}`
        );

        if (response.data.success) {
          setPetition(response.data.petition);
          setNewStatus(response.data.petition.status);
        }
      } catch (error) {
        console.error("Petition loading error:", error);
        const msg =
          error.response?.data?.message ||
          "Failed to load petition details. Please check connection.";
        setInlineAlert({
          type: "danger",
          text: msg,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPetition();
  }, [id]);

  const updateStatus = async () => {
    try {
      setUpdating(true);
      setInlineAlert(null);

      const response = await axios.put(
        `http://localhost:5000/api/officer/petition/${id}/status`,
        { status: newStatus }
      );

      if (response.data.success) {
        setInlineAlert({
          type: "success",
          text: "Petition status updated successfully!",
        });
        setPetition((prev) => ({
          ...prev,
          status: newStatus,
        }));
      }
    } catch (error) {
      console.error("Status update error:", error);
      setInlineAlert({
        type: "danger",
        text: "Failed to update status. Please try again.",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-content">
        <div className="container">
          {/* Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <div className="d-flex align-items-center gap-2">
                <h2 className="fw-bold text-dark mb-0">Petition Details #{id}</h2>
                {petition?.status && (
                  <span
                    className={`badge px-3 py-2 ${
                      petition.status === "Resolved"
                        ? "bg-success"
                        : petition.status === "In Progress"
                        ? "bg-primary"
                        : petition.status === "Rejected"
                        ? "bg-danger"
                        : "bg-warning text-dark"
                    }`}
                  >
                    {petition.status}
                  </span>
                )}
              </div>
              <p className="text-muted mb-0">
                Complete grievance information, location coordinates, and status logs.
              </p>
            </div>
            <button
              className="btn btn-outline-secondary fw-semibold px-3"
              onClick={() => navigate(-1)}
            >
              ← Go Back
            </button>
          </div>

          {/* Inline alert */}
          {inlineAlert && (
            <div
              className={`gov-alert gov-alert-${inlineAlert.type} mb-4 d-flex justify-content-between align-items-center`}
            >
              <span>{inlineAlert.text}</span>
              <button
                type="button"
                className="btn-close"
                onClick={() => setInlineAlert(null)}
              />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="mt-3 text-muted">Loading grievance details...</p>
            </div>
          )}

          {/* Petition Not Found */}
          {!loading && !petition && (
            <div className="gov-card p-5 text-center my-4">
              <div style={{ fontSize: "50px" }}>❌</div>
              <h4 className="fw-bold text-dark mt-3">Petition Not Found</h4>
              <p className="text-muted mb-4">
                The requested petition could not be found or may have been deleted.
              </p>
              <button className="btn-main px-4 py-2" onClick={() => navigate(-1)}>
                ← Return to Previous Page
              </button>
            </div>
          )}

          {/* Main Petition Details Card */}
          {!loading && petition && (
            <div className="gov-card p-4 p-md-5 mb-4">
              {/* Spam Warning Banner for Officer / Admin */}
              {isOfficerOrAdmin && petition.is_spam === 1 && (
                <div className="gov-alert gov-alert-danger mb-4 p-3 d-flex align-items-start gap-3">
                  <span style={{ fontSize: "24px" }}>⚠️</span>
                  <div>
                    <h6 className="fw-bold mb-1">Suspicious / Spam Complaint Flagged</h6>
                    <p className="mb-0 small">
                      <strong>Reason:</strong> {petition.spam_reason || "Potential junk or automated content detected."} (Spam Score: {petition.spam_score || "High"})
                    </p>
                  </div>
                </div>
              )}

              <div className="row g-4">
                {/* LEFT: Citizen & Location Information */}
                <div className="col-lg-6">
                  <div className="mb-4">
                    <h5 className="fw-bold text-dark pb-2 border-bottom">
                      👤 Citizen Information
                    </h5>
                    <div className="d-flex flex-column gap-2 mt-3">
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted">Citizen Name:</span>
                        <strong className="text-dark">{petition.citizen_name || "N/A"}</strong>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted">Contact Phone:</span>
                        <strong className="text-dark">{petition.phone || "N/A"}</strong>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted">Citizen User ID:</span>
                        <code>#{petition.citizen_id}</code>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted">Submission Date:</span>
                        <strong className="text-dark">
                          {new Date(petition.created_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="fw-bold text-dark pb-2 border-bottom">
                      📍 Problem Location
                    </h5>
                    <div className="d-flex flex-column gap-2 mt-3">
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted">Street:</span>
                        <strong className="text-dark">{petition.street || "-"}</strong>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted">Area / Locality:</span>
                        <strong className="text-dark">{petition.area || "-"}</strong>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted">City / State:</span>
                        <strong className="text-dark">
                          {petition.city || "Madurai"}, {petition.state || "Tamil Nadu"}
                        </strong>
                      </div>
                      {petition.latitude && petition.longitude && (
                        <div className="d-flex justify-content-between border-bottom pb-2">
                          <span className="text-muted">GPS Coordinates:</span>
                          <code>
                            {Number(petition.latitude).toFixed(6)}, {Number(petition.longitude).toFixed(6)}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Grievance Content & Photograph */}
                <div className="col-lg-6">
                  <div className="mb-4">
                    <h5 className="fw-bold text-dark pb-2 border-bottom">
                      📋 Grievance Categorization
                    </h5>
                    <div className="d-flex align-items-center gap-2 mt-3 mb-3">
                      <span className="text-muted">AI Category:</span>
                      <span className="badge bg-primary px-3 py-2 fs-6">
                        {petition.category || "General Civic Issue"}
                      </span>
                    </div>
                    <label className="text-muted small fw-bold mb-1">COMPLAINT STATEMENT:</label>
                    <div
                      className="p-3 bg-light rounded-3 border"
                      style={{ whiteSpace: "pre-wrap", minHeight: "100px" }}
                    >
                      {petition.description}
                    </div>
                  </div>

                  <div>
                    <h5 className="fw-bold text-dark pb-2 border-bottom">
                      📷 Supporting Photo
                    </h5>
                    {petition.image_path ? (
                      <div className="mt-3">
                        <p className="small text-muted mb-2">
                          Click image to view in high resolution:
                        </p>
                        <div
                          className="border rounded-3 p-2 bg-light text-center"
                          style={{ cursor: "zoom-in" }}
                          onClick={() => setShowImage(true)}
                        >
                          <img
                            src={`http://localhost:5000${petition.image_path}`}
                            alt="Grievance Attachment"
                            className="img-fluid rounded"
                            style={{ maxHeight: "260px", objectFit: "contain" }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted small mt-3">No photo attached with this petition.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* OFFICER / ADMIN STATUS UPDATE PANEL */}
              {isOfficerOrAdmin && (
                <div className="mt-5 pt-4 border-top">
                  {/* ── STATUS UPDATE (Department Officer & Admin only) ── */}
                  {!isMunicipalOfficer && (
                    <>
                      <h5 className="fw-bold text-dark mb-3">👮 Department Action: Update Status</h5>
                      <div className="row align-items-end g-3 mb-4">
                        <div className="col-md-5">
                          <label className="form-label fw-semibold">Select Redressal Status</label>
                          <select
                            className="form-select"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                          >
                            <option value="Pending">⏳ Pending</option>
                            <option value="Under Review">🔍 Under Review</option>
                            <option value="In Progress">🔧 In Progress</option>
                            <option value="Resolved">✅ Resolved</option>
                            <option value="Rejected">❌ Rejected</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <button
                            className="btn-main px-4"
                            onClick={updateStatus}
                            disabled={updating || newStatus === petition.status}
                          >
                            {updating ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Updating...
                              </>
                            ) : (
                              "Save Status Update"
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── DEPARTMENT ASSIGNMENT ── */}
                  {!isDepartmentOfficer && (
                    <div className={!isMunicipalOfficer ? "border-top pt-4" : ""}>
                      <h5 className="fw-bold text-dark mb-1">🏢 Department Assignment</h5>
                      <p className="text-muted small mb-3">
                        Route this grievance to the appropriate government department for action.
                      </p>

                      {/* Current assignment info row */}
                      <div className="d-flex flex-wrap gap-3 mb-3">
                        <div
                          className="px-3 py-2 rounded-3 small"
                          style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
                        >
                          <span className="text-muted me-1">AI Category:</span>
                          <strong className="text-primary">
                            {petition.category || "General Civic Issue"}
                          </strong>
                        </div>
                        <div
                          className="px-3 py-2 rounded-3 small"
                          style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}
                        >
                          <span className="text-muted me-1">Recommended Department:</span>
                          <strong className="text-success">
                            {getRecommendedDepartment(petition.category)}
                          </strong>
                        </div>
                        {petition.assigned_department && (
                          <div
                            className="px-3 py-2 rounded-3 small"
                            style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}
                          >
                            <span className="text-muted me-1">Assigned Department:</span>
                            <strong className="text-warning-emphasis">
                              ✓ {petition.assigned_department}
                            </strong>
                          </div>
                        )}
                      </div>

                      {/* Assignment alert */}
                      {assignAlert && (
                        <div
                          className={`gov-alert gov-alert-${assignAlert.type} mb-3 d-flex justify-content-between align-items-center`}
                        >
                          <span>{assignAlert.text}</span>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setAssignAlert(null)}
                          />
                        </div>
                      )}

                      <div className="row g-3 align-items-end">
                        {/* Department dropdown */}
                        <div className="col-md-7">
                          <label className="form-label fw-semibold">Select Department</label>
                          <select
                            className="form-select"
                            value={assignDept}
                            onChange={(e) => setAssignDept(e.target.value)}
                          >
                            <option value="">— Select Department —</option>
                            {DEPARTMENTS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Save Assignment button */}
                        <div className="col-md-5">
                          <button
                            className="btn btn-success fw-semibold px-4 w-100"
                            onClick={saveAssignment}
                            disabled={assigning || !assignDept}
                          >
                            {assigning ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Assigning...
                              </>
                            ) : (
                              "🏢 Assign Department"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* CITIZEN FEEDBACK SECTION (For Citizens when petition is Resolved) */}
          {!loading && petition && petition.status === "Resolved" && !isOfficerOrAdmin && (
            <CitizenFeedback
              petitionId={petition.id}
              citizenId={
                JSON.parse(sessionStorage.getItem("citizenUser") || "{}")?.id ||
                petition.citizen_id
              }
            />
          )}

          {/* IMAGE POPUP MODAL */}
          {showImage && petition?.image_path && (
            <div
              onClick={() => setShowImage(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(15, 23, 42, 0.85)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                padding: "20px",
                cursor: "zoom-out",
                backdropFilter: "blur(4px)",
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImage(false);
                }}
                className="btn btn-light rounded-circle shadow"
                style={{
                  position: "absolute",
                  top: "24px",
                  right: "24px",
                  width: "44px",
                  height: "44px",
                  fontSize: "20px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10000,
                }}
              >
                ✕
              </button>

              <img
                src={`http://localhost:5000${petition.image_path}`}
                alt="Grievance Full Preview"
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: "92%",
                  maxHeight: "88vh",
                  objectFit: "contain",
                  borderRadius: "12px",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                }}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Petition;