import api from "./api";

export async function loginRequest(email, password) {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  return response.data;
}

export async function getBootstrapStatus() {
  const response = await api.get("/auth/bootstrap-status");
  return response.data;
}

export async function bootstrapAdminRequest(data) {
  const response = await api.post("/auth/bootstrap-admin", data);
  return response.data;
}