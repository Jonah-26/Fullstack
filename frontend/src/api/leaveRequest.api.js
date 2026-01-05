import http from "./http";

export const leaveRequestApi = {
  add: (payload) => http.post("/leave-request", payload),

  getHistory: (employeeId, config) =>
    http.get(`/leave-request/${employeeId}`, config),

  updateStatus: (id, status) =>
    http.patch(`/leave-request/${id}/status`, { status }),
};
