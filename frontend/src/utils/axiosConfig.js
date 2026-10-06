import axios from "axios";

/**
 * Check if a stored JWT token string is valid, unexpired, and matches expected role
 */
export const validateToken = (tokenKey, expectedRole) => {
  const token = sessionStorage.getItem(tokenKey);
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(payloadBase64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);

    // 1. Expiration check
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return false;
    }

    // 2. Role check if expectedRole specified
    if (expectedRole && decoded.role !== expectedRole) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Helper to clear stale credentials from other roles upon login or explicit cleanup
 */
export const clearStaleTokens = (activeRole) => {
  if (activeRole === "citizen") {
    sessionStorage.removeItem("officerToken");
    sessionStorage.removeItem("officer");
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("admin");
  } else if (activeRole === "officer") {
    sessionStorage.removeItem("citizenToken");
    sessionStorage.removeItem("citizenUser");
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("admin");
  } else if (activeRole === "admin") {
    sessionStorage.removeItem("citizenToken");
    sessionStorage.removeItem("citizenUser");
    sessionStorage.removeItem("officerToken");
    sessionStorage.removeItem("officer");
  } else {
    sessionStorage.removeItem("citizenToken");
    sessionStorage.removeItem("citizenUser");
    sessionStorage.removeItem("officerToken");
    sessionStorage.removeItem("officer");
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("admin");
  }
};

/**
 * Configure Axios request interceptor to automatically attach Bearer token
 */
axios.interceptors.request.use(
  (config) => {
    let token = null;

    if (config.url && config.url.includes("/api/admin")) {
      if (validateToken("adminToken", "admin")) {
        token = sessionStorage.getItem("adminToken");
      }
    } else if (config.url && config.url.includes("/api/officer")) {
      if (validateToken("officerToken", "officer")) {
        token = sessionStorage.getItem("officerToken");
      }
    } else if (
      config.url &&
      (config.url.includes("/api/petition") || config.url.includes("/api/feedback"))
    ) {
      if (validateToken("citizenToken", "citizen")) {
        token = sessionStorage.getItem("citizenToken");
      }
    } else {
      if (validateToken("citizenToken", "citizen")) {
        token = sessionStorage.getItem("citizenToken");
      } else if (validateToken("officerToken", "officer")) {
        token = sessionStorage.getItem("officerToken");
      } else if (validateToken("adminToken", "admin")) {
        token = sessionStorage.getItem("adminToken");
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios;
