import http from "./http.js"; 

export const authApi = {
  login: (payload) => http.post("/api/auth/login", payload),
  register: (payload) => http.post("/api/auth/register", payload),
  me: () => http.get("/api/auth/me"),
};

