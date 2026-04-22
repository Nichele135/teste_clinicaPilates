import api from "./api";

export async function getScheduleSlots() {
  const response = await api.get("/ScheduleSlots");
  return response.data;
}

export async function getScheduleSlotsByDate(date) {
  const response = await api.get(`/ScheduleSlots/by-date?date=${date}`);
  return response.data;
}

export async function activateScheduleSlot(id) {
  const response = await api.patch(`/ScheduleSlots/${id}/activate`);
  return response.data;
}

export async function deactivateScheduleSlot(id) {
  const response = await api.patch(`/ScheduleSlots/${id}/deactivate`);
  return response.data;
}

export async function createScheduleOverride(data) {
  const response = await api.post("/ScheduleSlots/override", data);
  return response.data;
}

export async function blockScheduleRange(data) {
  const response = await api.post("/ScheduleSlots/block-range", data);
  return response.data;
}

export async function blockFullDay(data) {
  const response = await api.post("/ScheduleSlots/block-full-day", data);
  return response.data;
}

export async function removeScheduleOverride(overrideId) {
  const response = await api.delete(`/ScheduleSlots/override/${overrideId}`);
  return response.data;
}