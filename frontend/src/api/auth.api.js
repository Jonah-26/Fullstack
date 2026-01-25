import http from "../api/http.js";

export async function registerUser({ email, password, fullName }) {
  const res = await http.post("/auth/register", { email, password, fullName });
  const { token } = res.data;
  localStorage.setItem("token", token);
  return res.data;
}
