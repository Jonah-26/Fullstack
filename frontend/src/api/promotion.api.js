import http from "./http";

export const promotionApi = {
  add: (payload) => http.post("/promotion", payload),
  getHistory: (employeeId) => http.get(`/promotion/${employeeId}`),
};
