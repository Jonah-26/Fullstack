import axios from "axios";

// Base backend URL (NO /api here)
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

// Axios instance with /api applied ONCE
const http = axios.create({
  baseURL: `${BASE_URL.replace(/\/+$/, "")}/api`,
  timeout: 30000,
});

// -----------------------------
// Global no-cache defaults
// -----------------------------
http.defaults.headers.common["Cache-Control"] = "no-cache";
http.defaults.headers.common["Pragma"] = "no-cache";
http.defaults.headers.common["Expires"] = "0";

// -----------------------------
// Request interceptor
// -----------------------------
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Bust cache for ALL GET requests
  if ((config.method || "").toLowerCase() === "get") {
    config.params = {
      ...(config.params || {}),
      _t: Date.now(),
    };
  }

  return config;
});

export default http;

// -----------------------------
// Error helper
// -----------------------------
export function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Request failed. Please try again."
  );
}
