import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// =====================================================
// CATEGORY ICONS (16 UNIQUE CATEGORIES)
// =====================================================
const createCategoryIcon = (category) => {
  const norm = category ? category.toLowerCase().trim() : "";

  let icon = "📍";

  if (norm.includes("road") || norm.includes("pothole")) {
    icon = "🛣️";
  } else if (norm.includes("water supply") || (norm.includes("water") && !norm.includes("pollution"))) {
    icon = "💧";
  } else if (norm.includes("street light") || norm.includes("lamp")) {
    icon = "💡";
  } else if (norm.includes("electricity") || norm.includes("power") || norm.includes("transformer")) {
    icon = "⚡";
  } else if (norm.includes("garbage") || norm.includes("trash") || norm.includes("waste")) {
    icon = "🗑️";
  } else if (norm.includes("drainage") || norm.includes("sewage") || norm.includes("sewer")) {
    icon = "🚰";
  } else if (norm.includes("traffic") || norm.includes("signal")) {
    icon = "🚥";
  } else if (norm.includes("toilet") || norm.includes("sanitation")) {
    icon = "🚻";
  } else if (norm.includes("tree") || norm.includes("branch")) {
    icon = "🌳";
  } else if (norm.includes("animal") || norm.includes("dog") || norm.includes("cattle")) {
    icon = "🐕";
  } else if (norm.includes("noise") || norm.includes("loud")) {
    icon = "🔊";
  } else if (norm.includes("air") || norm.includes("smoke") || norm.includes("fumes")) {
    icon = "💨";
  } else if (norm.includes("water pollution") || norm.includes("polluted water")) {
    icon = "🧪";
  } else if (norm.includes("dumping") || norm.includes("debris")) {
    icon = "🚜";
  } else if (norm.includes("encroachment") || norm.includes("footpath")) {
    icon = "🚧";
  } else {
    icon = "📍";
  }

  return L.divIcon({
    className: "custom-category-marker",
    html: `
      <div
        style="
          width:42px;
          height:42px;
          border-radius:50%;
          background:white;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:22px;
          border:3px solid #1E3A8A;
          box-shadow:0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s ease;
        "
      >
        ${icon}
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42],
  });
};

// =====================================================
// MAP AUTO FIT
// =====================================================
function MapAutoFit({ petitions }) {
  const map = useMap();

  useEffect(() => {
    if (petitions.length === 0) return;

    const bounds = petitions.map((petition) => [
      Number(petition.latitude),
      Number(petition.longitude),
    ]);

    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 16,
    });
  }, [petitions, map]);

  return null;
}

// =====================================================
// MAIN OFFICER MAP COMPONENT
// =====================================================
function OfficerMap() {
  const navigate = useNavigate();

  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const maduraiPosition = [9.9252, 78.1198];

  useEffect(() => {
    const fetchMapPetitions = async () => {
      try {
        const response = await axios.get("https://smart-grievance-backend-b6ow.onrender.com/api/officer/map");

        if (response.data.success) {
          const validPetitions = response.data.petitions.filter((petition) => {
            const latitude = Number(petition.latitude);
            const longitude = Number(petition.longitude);

            return (
              petition.latitude !== null &&
              petition.longitude !== null &&
              !Number.isNaN(latitude) &&
              !Number.isNaN(longitude)
            );
          });

          setPetitions(validPetitions);
        }
      } catch (error) {
        console.error("Map loading error:", error);
        setErrorMsg("Failed to load complaint coordinates. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMapPetitions();
  }, []);

  const LEGEND_ITEMS = [
    { label: "Road Damage", icon: "🛣️" },
    { label: "Water Supply", icon: "💧" },
    { label: "Street Light", icon: "💡" },
    { label: "Electricity / Power", icon: "⚡" },
    { label: "Garbage / Waste", icon: "🗑️" },
    { label: "Drainage / Sewage", icon: "🚰" },
    { label: "Traffic", icon: "🚥" },
    { label: "Public Toilet", icon: "🚻" },
    { label: "Tree / Fallen Tree", icon: "🌳" },
    { label: "Stray Animals", icon: "🐕" },
    { label: "Noise Pollution", icon: "🔊" },
    { label: "Air Pollution", icon: "💨" },
    { label: "Water Pollution", icon: "🧪" },
    { label: "Illegal Dumping", icon: "🚜" },
    { label: "Encroachment", icon: "🚧" },
    { label: "Other", icon: "📍" },
  ];

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-content">
        <div className="container">
          {/* Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h2 className="fw-bold text-dark mb-1">🗺️ Live Grievance Map</h2>
              <p className="text-muted mb-0">
                Spatial GIS visualization of all registered citizen grievances across municipal zones.
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary fw-semibold px-3"
                onClick={() => navigate("/officer-dashboard")}
              >
                ← Dashboard
              </button>
            </div>
          </div>

          {/* Inline Error */}
          {errorMsg && (
            <div className="gov-alert gov-alert-danger mb-4">
              <strong>⚠️ Error: </strong> {errorMsg}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="mt-3 text-muted">Plotting complaint coordinates on map...</p>
            </div>
          )}

          {/* Map Card */}
          {!loading && (
            <div className="gov-card overflow-hidden mb-4">
              {/* Map Title Bar */}
              <div
                className="p-3 text-white d-flex justify-content-between align-items-center"
                style={{ background: "#1E3A8A" }}
              >
                <h5 className="mb-0 fw-bold">Active Complaint Hotspots</h5>
                <span className="badge bg-light text-primary fw-bold">
                  {petitions.length} Locations Plotted
                </span>
              </div>

              {/* Leaflet Map */}
              <div style={{ height: "620px", width: "100%", position: "relative" }}>
                {petitions.length === 0 ? (
                  <div className="alert alert-info m-4">
                    No active complaint locations currently available with valid coordinates.
                  </div>
                ) : (
                  <MapContainer
                    center={maduraiPosition}
                    zoom={12}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapAutoFit petitions={petitions} />

                    {petitions.map((petition) => (
                      <Marker
                        key={petition.id}
                        position={[
                          Number(petition.latitude),
                          Number(petition.longitude),
                        ]}
                        icon={createCategoryIcon(petition.category)}
                      >
                        <Popup>
                          <div style={{ minWidth: "260px", padding: "4px" }}>
                            <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                              <h6 className="fw-bold text-dark mb-0">
                                Petition #{petition.id}
                              </h6>
                              <span
                                className={`badge ${
                                  petition.status === "Resolved"
                                    ? "bg-success"
                                    : petition.status === "In Progress"
                                    ? "bg-primary"
                                    : "bg-warning text-dark"
                                }`}
                              >
                                {petition.status || "Pending"}
                              </span>
                            </div>

                            <p className="mb-1 small">
                              <strong>Citizen:</strong> {petition.citizen_name || "Anonymous"}
                            </p>
                            <p className="mb-1 small">
                              <strong>Category:</strong>{" "}
                              <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25">
                                {petition.category || "General"}
                              </span>
                            </p>
                            <p className="mb-1 small">
                              <strong>Area:</strong> {petition.area || "-"}
                            </p>
                            {petition.street && (
                              <p className="mb-1 small">
                                <strong>Street:</strong> {petition.street}
                              </p>
                            )}

                            <div className="p-2 bg-light rounded mt-2 small text-muted">
                              <strong>Description: </strong>
                              {petition.description?.length > 100
                                ? `${petition.description.substring(0, 100)}...`
                                : petition.description}
                            </div>

                            <div className="mt-3 text-end">
                              <button
                                className="btn btn-sm btn-primary w-100 fw-semibold"
                                onClick={() => navigate(`/petition/${petition.id}`)}
                              >
                                View Petition Details →
                              </button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
              </div>
            </div>
          )}

          {/* Map Legend */}
          <div className="gov-card p-4 mb-5">
            <h6 className="fw-bold text-dark mb-3">🏷️ Map Category Legend (16 Categories)</h6>
            <div className="d-flex flex-wrap gap-3 small text-secondary">
              {LEGEND_ITEMS.map((item) => (
                <div key={item.label} className="d-flex align-items-center gap-2 p-2 bg-light rounded border">
                  <span style={{ fontSize: "20px" }}>{item.icon}</span>
                  <strong>{item.label}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default OfficerMap;