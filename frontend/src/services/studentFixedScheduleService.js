import api from "./api";

export async function getStudentFixedSchedules(studentId) {
  const response = await api.get(`/StudentFixedSchedules/student/${studentId}`);
  return response.data;
}

export async function createStudentFixedSchedule(data) {
  const response = await api.post("/StudentFixedSchedules", data);
  return response.data;
}

export async function deleteStudentFixedSchedule(id) {
  const response = await api.delete(`/StudentFixedSchedules/${id}`);
  return response.data;
}