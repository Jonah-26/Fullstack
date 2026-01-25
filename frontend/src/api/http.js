import axios from "axios";

// Base backend URL (NO /api here)
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";


// Axios instance with /api applied ONCE
const http = axios.create({
  baseURL: `${BASE_URL}/api`,
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
