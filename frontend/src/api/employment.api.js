import http from "./http";

export const employmentApi = {
  add: (payload) => http.post("/employment", payload),

  getHistory: (employeeId, config) =>
    http.get(`/employment/${employeeId}`, config),
};
