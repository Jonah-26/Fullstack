import http from "./http";

export const dashboardApi = {
  summary: (config) => http.get("/dashboard/summary", config),
};


