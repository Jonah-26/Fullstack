import http from "./http";

export const leaveCreditApi = {
  // upsert credits (employeeId + year unique)
  upsert: (payload) => http.post("/leave-credit", payload),

  // get credits history per employee
  getHistory: (employeeId, config) =>
    http.get(`/leave-credit/${employeeId}`, config),
};
