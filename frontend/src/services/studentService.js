import api from "./api";

export async function getStudents() {
  const response = await api.get("/students");
  return response.data;
}

export async function createStudent(studentData) {
  const response = await api.post("/students", studentData);
  return response.data;
}

export async function updateStudent(id, studentData) {
  const response = await api.put(`/students/${id}`, studentData);
  return response.data;
}

export async function deactivateStudent(id) {
  const response = await api.patch(`/students/${id}/deactivate`);
  return response.data;
}

export async function reactivateStudent(id) {
  const response = await api.patch(`/students/${id}/reactivate`);
  return response.data;
}

export async function assignPlanToStudent(id, planId) {
  const response = await api.patch(`/students/${id}/assign-plan`, {
    planId,
  });
  return response.data;
}