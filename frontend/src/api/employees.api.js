import http from "./http";

export const employeesApi = {
  getAll: (params) => http.get("/employees", { params }),
  getById: (id) => http.get(`/employees/${id}`),

  create: (payload) => http.post("/employees", payload),
  update: (id, payload) => http.put(`/employees/${id}`, payload),

  softDelete: (id) => http.patch(`/employees/${id}`),
  permanentDelete: (id) => http.delete(`/employees/permanent/${id}`),
};
