import api from "./api";

export async function getUsers() {
  const response = await api.get("/Users");
  return response.data;
}

export async function createUser(data) {
  const response = await api.post("/Users", data);
  return response.data;
}