import api from "./api";

// Buscar overrides por data
export async function getOverridesByDate(date) {
  const response = await api.get(`/ScheduleSlotOverrides/by-date?date=${date}`);
  return response.data;
}

// Criar override
export async function createOverride(data) {
  const response = await api.post("/ScheduleSlotOverrides", data);
  return response.data;
}

// Atualizar override
export async function updateOverride(id, data) {
  const response = await api.put(`/ScheduleSlotOverrides/${id}`, data);
  return response.data;
}