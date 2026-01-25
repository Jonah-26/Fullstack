import http from "./http";

// object-style API to match: authApi.login(...)
export const authApi = {
  register: (payload) => http.post("/auth/register", payload),
  login: (payload) => http.post("/auth/login", payload),
  me: () => http.get("/auth/me"),
};

// optional helpers (useful later)
export async function registerUser({ email, password, fullName }) {
  const res = await authApi.register({ email, password, fullName });
  const { token } = res.data || {};
  if (token) localStorage.setItem("token", token);
  return res.data;
}

export async function loginUser({ email, password }) {
  const res = await authApi.login({ email, password });
  const { token } = res.data || {};
  if (token) localStorage.setItem("token", token);
  return res.data;
}

export function logoutUser() {
  localStorage.removeItem("token");
}
