import http from "./http";

export const salaryApi = {
  add: (payload) => http.post("/salary", payload),

  // your backend supports GET /salary/:id
  getHistory: (employeeId) => http.get(`/salary/${employeeId}`),
};
