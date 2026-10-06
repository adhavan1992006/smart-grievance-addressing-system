import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { validateToken } from "../utils/axiosConfig";

/**
 * Protect Citizen Routes (/citizen-dashboard, /submit-petition, /track-petition)
 */
export const CitizenProtectedRoute = () => {
  const hasValidCitizenToken = validateToken("citizenToken", "citizen");
  const hasUserObj = Boolean(sessionStorage.getItem("citizenUser"));

  if (!hasValidCitizenToken || !hasUserObj) {
    // Clear invalid/stale citizen session
    sessionStorage.removeItem("citizenToken");
    sessionStorage.removeItem("citizenUser");

    // Redirect to active session if user is logged in under a different role
    if (validateToken("officerToken", "officer") && sessionStorage.getItem("officer")) {
      return <Navigate to="/officer-dashboard" replace />;
    }
    if (validateToken("adminToken", "admin") && sessionStorage.getItem("admin")) {
      return <Navigate to="/admin-dashboard" replace />;
    }

    return <Navigate to="/citizen-login" replace />;
  }

  return <Outlet />;
};

/**
 * Protect Officer Routes (/officer-dashboard, /officer-petitions, etc.)
 */
export const OfficerProtectedRoute = () => {
  const hasValidOfficerToken = validateToken("officerToken", "officer");
  const hasOfficerObj = Boolean(sessionStorage.getItem("officer"));

  if (!hasValidOfficerToken || !hasOfficerObj) {
    // Clear invalid/stale officer session
    sessionStorage.removeItem("officerToken");
    sessionStorage.removeItem("officer");

    // Redirect to active session if user is logged in under a different role
    if (validateToken("citizenToken", "citizen") && sessionStorage.getItem("citizenUser")) {
      return <Navigate to="/citizen-dashboard" replace />;
    }
    if (validateToken("adminToken", "admin") && sessionStorage.getItem("admin")) {
      return <Navigate to="/admin-dashboard" replace />;
    }

    return <Navigate to="/officer-login" replace />;
  }

  return <Outlet />;
};

/**
 * Protect Admin Dashboard Route (/admin-dashboard)
 */
export const AdminProtectedRoute = () => {
  const hasValidAdminToken = validateToken("adminToken", "admin");
  const hasAdminObj = Boolean(sessionStorage.getItem("admin"));

  if (!hasValidAdminToken || !hasAdminObj) {
    // Clear invalid/stale admin session
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("admin");

    // Redirect to active session if user is logged in under a different role
    if (validateToken("citizenToken", "citizen") && sessionStorage.getItem("citizenUser")) {
      return <Navigate to="/citizen-dashboard" replace />;
    }
    if (validateToken("officerToken", "officer") && sessionStorage.getItem("officer")) {
      return <Navigate to="/officer-dashboard" replace />;
    }

    return <Navigate to="/admin-login" replace />;
  }

  return <Outlet />;
};

/**
 * Protect Shared Single Petition View (/petition/:id)
 * Accessible by authenticated Citizen, Officer, or Admin
 */
export const PetitionProtectedRoute = () => {
  const isCitizen = validateToken("citizenToken", "citizen") && Boolean(sessionStorage.getItem("citizenUser"));
  const isOfficer = validateToken("officerToken", "officer") && Boolean(sessionStorage.getItem("officer"));
  const isAdmin = validateToken("adminToken", "admin") && Boolean(sessionStorage.getItem("admin"));

  if (!isCitizen && !isOfficer && !isAdmin) {
    return <Navigate to="/citizen-login" replace />;
  }

  return <Outlet />;
};
