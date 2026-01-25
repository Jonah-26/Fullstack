import axios from "axios";

const RAW_BASE = import.meta.env.VITE_API_BASE_URL;

if (!RAW_BASE) {
  throw new Error("Missing VITE_API_BASE_URL (check Render env + rebuild).");
}

// remove trailing slash if present
const BASE_URL = RAW_BASE.replace(/\/+$/, "");

console.log("✅ API BASE_URL =", BASE_URL);

const http = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if ((config.method || "").toLowerCase() === "get") {
    config.params = { ...(config.params || {}), _t: Date.now() };
  }
  return config;
});

export default http;

export function getApiErrorMessage(err) {
  return err?.response?.data?.message || err?.message || "Request failed. Please try again.";
}
