import api from "./api";

export async function getClassSessions() {
  const response = await api.get("/ClassSessions");
  return response.data;
}

export async function quickBookStudent(data) {
  const response = await api.post("/ClassSessions/quick-book", data);
  return response.data;
}

export async function removeStudentFromSession(classSessionId, studentId) {
  const response = await api.patch(
    `/ClassSessions/${classSessionId}/remove-student/${studentId}`
  );
  return response.data;
}

// 🔥 SUA FUNÇÃO (override)
export async function getOverridesByDate(date) {
  const response = await api.get(`/ScheduleSlotOverrides/by-date?date=${date}`);
  return response.data;
}

// 🔥 FUNÇÃO DA MAIN
export async function cancelStudentBooking(classSessionId, studentId) {
  const response = await api.patch(
    `/ClassSessions/${classSessionId}/cancel-student/${studentId}`
  );
  return response.data;
}

export async function publicBookStudent(data) {
  const response = await api.post("/ClassSessions/public-book", data);
  return response.data;
}