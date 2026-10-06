import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// =====================================================
// LOCATION SEARCH COMPONENT
// =====================================================
function LocationSearch({ onLocationSelect, setInlineError }) {
  const inputRef = useRef(null);
  const map = useMap();
  const placesLib = useMapsLibrary("places");

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "in" },
      fields: ["formatted_address", "geometry", "name", "address_components"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        if (setInlineError) {
          setInlineError("Please select a valid location from the Google suggestions dropdown.");
        }
        return;
      }

      const latitude = place.geometry.location.lat();
      const longitude = place.geometry.location.lng();

      let street = "";
      let area = "";
      let city = "";
      let state = "";

      if (place.address_components) {
        place.address_components.forEach((component) => {
          const types = component.types;
          if (types.includes("route")) {
            street = component.long_name;
          }
          if (
            types.includes("sublocality") ||
            types.includes("sublocality_level_1") ||
            types.includes("neighborhood")
          ) {
            if (!area) area = component.long_name;
          }
          if (types.includes("locality")) {
            city = component.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            state = component.long_name;
          }
        });
      }

      if (map) {
        map.panTo({ lat: latitude, lng: longitude });
        map.setZoom(17);
      }

      onLocationSelect({
        latitude,
        longitude,
        name: place.name || "",
        address: place.formatted_address || "",
        street,
        area,
        city,
        state,
      });
    });

    return () => {
      if (listener) listener.remove();
    };
  }, [placesLib, map, onLocationSelect, setInlineError]);

  return (
    <div className="mb-3">
      <label className="form-label fw-bold text-dark">
        Search Problem Location <span className="text-danger">*</span>
      </label>
      <div className="input-group">
        <span className="input-group-text bg-light">🔍</span>
        <input
          ref={inputRef}
          type="text"
          className="form-control"
          placeholder="Search street, area, locality, or landmark in Google Maps"
          autoComplete="off"
        />
      </div>
      <small className="text-muted">
        Type and pick a location from the suggestions to auto-pin coordinates.
      </small>
    </div>
  );
}

// =====================================================
// MAIN SUBMIT PETITION COMPONENT
// =====================================================
function SubmitPetition() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("citizenUser") || "{}");

  const [formData, setFormData] = useState({
    city: "Madurai",
    state: "Tamil Nadu",
    street: "",
    area: "",
    description: "",
  });

  const [selectedLocation, setSelectedLocation] = useState({
    lat: 9.9252,
    lng: 78.1198,
  });

  const [locationSelected, setLocationSelected] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!user?.id) {
      navigate("/citizen-login");
    }
  }, [user, navigate]);

  const handleLocationSelect = (location) => {
    setErrorMsg("");
    setFormData((prev) => ({
      ...prev,
      city: location.city || "Madurai",
      state: location.state || "Tamil Nadu",
      street: location.street || prev.street || "",
      area: location.area || prev.area || "",
    }));

    setSelectedLocation({
      lat: location.latitude,
      lng: location.longitude,
    });

    setLocationSelected(true);
  };

  const handleChange = (e) => {
    setErrorMsg("");
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    setErrorMsg("");
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Image size exceeds 5 MB limit. Please upload a smaller image.");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!locationSelected) {
      setErrorMsg("Please search and select the exact problem location on the map.");
      window.scrollTo({ top: 200, behavior: "smooth" });
      return;
    }

    if (!formData.street && !formData.area) {
      setErrorMsg("Please provide the street name or area where the problem is located.");
      return;
    }

    if (!formData.description.trim()) {
      setErrorMsg("Please provide a detailed description of the complaint.");
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();

      data.append("citizen_id", user.id);
      data.append("citizen_name", user.full_name);
      data.append("phone", user.phone);

      data.append("city", formData.city);
      data.append("state", formData.state);
      data.append("street", formData.street);
      data.append("area", formData.area);

      data.append("latitude", selectedLocation.lat);
      data.append("longitude", selectedLocation.lng);

      data.append("description", formData.description);

      if (image) {
        data.append("image", image);
      }

      const res = await axios.post(
        "https://smart-grievance-backend-b6ow.onrender.com/api/petition/submit",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccessMsg(res.data.message || "Petition submitted successfully!");
      setFormData({
        city: "Madurai",
        state: "Tamil Nadu",
        street: "",
        area: "",
        description: "",
      });
      setSelectedLocation({
        lat: 9.9252,
        lng: 78.1198,
      });
      setLocationSelected(false);
      setImage(null);
      setImagePreview(null);

      const fileInput = document.getElementById("petitionImage");
      if (fileInput) fileInput.value = "";

      window.scrollTo({ top: 100, behavior: "smooth" });
    } catch (err) {
      console.error("Petition submission error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg("Submission failed. Please check network connection and try again.");
      }
      window.scrollTo({ top: 100, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-content">
        <APIProvider
          apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          libraries={["places"]}
        >
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                {/* Header card */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                  <div>
                    <h2 className="fw-bold text-dark mb-1">📝 Submit Public Grievance</h2>
                    <p className="text-muted mb-0">
                      Pin the exact problem location on Google Maps and describe the civic issue.
                    </p>
                  </div>
                  <button
                    className="btn btn-outline-secondary fw-semibold px-3"
                    onClick={() => navigate("/citizen-dashboard")}
                  >
                    ← Dashboard
                  </button>
                </div>

                {/* Inline Alert Messages */}
                {successMsg && (
                  <div className="gov-alert gov-alert-success mb-4 d-flex justify-content-between align-items-center">
                    <div>
                      <strong>✅ Success: </strong>
                      {successMsg}
                    </div>
                    <button
                      className="btn btn-sm btn-outline-success ms-3"
                      onClick={() => navigate("/track-petition")}
                    >
                      Track Petitions →
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <div className="gov-alert gov-alert-danger mb-4">
                    <strong>⚠️ Error: </strong>
                    {errorMsg}
                  </div>
                )}

                <div className="gov-card p-4 p-md-5 mb-5">
                  <form onSubmit={handleSubmit}>
                    {/* SECTION 1: CITIZEN INFORMATION */}
                    <div className="mb-4">
                      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                        <span className="badge bg-primary rounded-circle">1</span>
                        <h5 className="fw-bold mb-0 text-dark">Citizen Information</h5>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label text-muted small fw-bold">
                            Full Name
                          </label>
                          <input
                            className="form-control bg-light"
                            value={user.full_name || ""}
                            disabled
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label text-muted small fw-bold">
                            Registered Phone
                          </label>
                          <input
                            className="form-control bg-light"
                            value={user.phone || ""}
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: MAP LOCATION */}
                    <div className="mb-4">
                      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                        <span className="badge bg-primary rounded-circle">2</span>
                        <h5 className="fw-bold mb-0 text-dark">Problem Location</h5>
                      </div>

                      <LocationSearch
                        onLocationSelect={handleLocationSelect}
                        setInlineError={setErrorMsg}
                      />

                      <div
                        style={{
                          width: "100%",
                          height: "360px",
                          marginBottom: "20px",
                          borderRadius: "12px",
                          overflow: "hidden",
                          border: "1px solid var(--gov-border)",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                        }}
                      >
                        <Map
                          defaultCenter={{
                            lat: 9.9252,
                            lng: 78.1198,
                          }}
                          center={selectedLocation}
                          defaultZoom={13}
                          zoom={locationSelected ? 17 : 13}
                          mapId="SMART_GRIEVANCE_MAP"
                        >
                          <AdvancedMarker position={selectedLocation} />
                        </Map>
                      </div>

                      {locationSelected ? (
                        <div className="p-3 mb-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 d-flex align-items-center gap-3">
                          <span style={{ fontSize: "24px" }}>📍</span>
                          <div className="small">
                            <strong className="text-success">Exact Coordinates Pinned:</strong>
                            <div>
                              Latitude: <code>{selectedLocation.lat.toFixed(6)}</code> | Longitude: <code>{selectedLocation.lng.toFixed(6)}</code>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 mb-3 bg-light border rounded-3 small text-muted">
                          ℹ️ Search your street or area above to automatically center the pin and fill the address details.
                        </div>
                      )}

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Street / Road</label>
                          <input
                            type="text"
                            className="form-control"
                            name="street"
                            placeholder="e.g. West Veli Street"
                            value={formData.street}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Area / Ward / Locality</label>
                          <input
                            type="text"
                            className="form-control"
                            name="area"
                            placeholder="e.g. Simmakkal"
                            value={formData.area}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">City</label>
                          <input
                            type="text"
                            className="form-control"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">State</label>
                          <input
                            type="text"
                            className="form-control"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: COMPLAINT DESCRIPTION */}
                    <div className="mb-4">
                      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                        <span className="badge bg-primary rounded-circle">3</span>
                        <h5 className="fw-bold mb-0 text-dark">Grievance Description</h5>
                      </div>

                      <label className="form-label fw-semibold">
                        Describe the problem clearly <span className="text-danger">*</span>
                      </label>
                      <textarea
                        rows="5"
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Please describe the issue in detail (e.g. Deep pothole causing frequent traffic congestion and water logging near bus stop)..."
                        required
                      />
                      <small className="text-muted">
                        Our integrated AI automatically categorizes and prioritizes your grievance based on this description.
                      </small>
                    </div>

                    {/* SECTION 4: ATTACHMENT */}
                    <div className="mb-4">
                      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                        <span className="badge bg-primary rounded-circle">4</span>
                        <h5 className="fw-bold mb-0 text-dark">Upload Supporting Image</h5>
                      </div>

                      <label className="form-label fw-semibold">Photograph of Grievance (Optional)</label>
                      <input
                        id="petitionImage"
                        type="file"
                        className="form-control mb-2"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={handleImageChange}
                      />
                      <small className="text-muted d-block mb-3">
                        Allowed formats: JPEG, PNG, JPG, WebP. Maximum file size: 5 MB.
                      </small>

                      {imagePreview && (
                        <div className="p-2 border rounded-3 bg-light d-inline-block">
                          <p className="small fw-semibold text-muted mb-1">Image Preview:</p>
                          <img
                            src={imagePreview}
                            alt="Grievance preview"
                            style={{ maxHeight: "180px", maxWidth: "100%", borderRadius: "8px" }}
                          />
                        </div>
                      )}
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="pt-3 border-top d-flex justify-content-end gap-3">
                      <button
                        type="button"
                        className="btn btn-light px-4"
                        onClick={() => navigate("/citizen-dashboard")}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-main px-5"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                            Submitting Grievance...
                          </>
                        ) : (
                          "Submit Petition"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </APIProvider>
      </main>

      <Footer />
    </div>
  );
}

export default SubmitPetition;