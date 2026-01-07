import http from "./http.js";

export const dashboardApi = {
  summary: (config) => http.get("/dashboard/summary", config),
};
