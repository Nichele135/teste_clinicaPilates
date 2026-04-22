export function traduzirStatus(status) {
  if (status === "Booked") return "Agendado";
  if (status === "Cancelled") return "Cancelado";
  if (status === "Completed") return "Concluído";

  return status || "Sem status";
}