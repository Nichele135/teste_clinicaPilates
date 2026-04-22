import api from "./api";

export async function getMonthlyFinancialStatus(month, year) {
  const response = await api.get(
    `/Financial/monthly-status?month=${month}&year=${year}`
  );
  return response.data;
}

export async function markPaymentAsPaid(paymentId, notes = "") {
  const response = await api.patch(`/Financial/${paymentId}/pay`, {
    notes,
  });
  return response.data;
}

export async function undoPayment(paymentId) {
  const response = await api.patch(`/Financial/${paymentId}/undo`);
  return response.data;
}

export async function getStudentPaymentHistory(studentId) {
  const response = await api.get(`/Financial/student/${studentId}/history`);
  return response.data;
}