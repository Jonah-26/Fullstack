import http from "./http";

export const credentialApi = {
  add: (payload) => http.post("/credential", payload),
  getHistory: (employeeId, config) => http.get(`/credential/${employeeId}`, config),
};
