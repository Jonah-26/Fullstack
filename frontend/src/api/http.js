import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// ✅ Global no-cache defaults (prevents stale GET caching / 304 issues)
http.defaults.headers.common["Cache-Control"] = "no-cache";
http.defaults.headers.common["Pragma"] = "no-cache";
http.defaults.headers.common["Expires"] = "0";

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // ✅ Bust cache for ALL GET requests
  if ((config.method || "").toLowerCase() === "get") {
    config.params = { ...(config.params || {}), _t: Date.now() };
  }

  return config;
});

export default http;

export function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Request failed. Please try again."
  );
}
