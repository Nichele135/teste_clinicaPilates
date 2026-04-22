import api from "./api";

export async function getPlans() {
  const response = await api.get("/Plans");
  return response.data;
}

export async function createPlan(planData) {
  const response = await api.post("/Plans", planData);
  return response.data;
}

export async function updatePlan(id, planData) {
  const response = await api.put(`/Plans/${id}`, planData);
  return response.data;
}

export async function deactivatePlan(id) {
  const response = await api.patch(`/Plans/${id}/deactivate`);
  return response.data;
}

export async function activatePlan(id) {
  const response = await api.patch(`/Plans/${id}/activate`);
  return response.data;
}