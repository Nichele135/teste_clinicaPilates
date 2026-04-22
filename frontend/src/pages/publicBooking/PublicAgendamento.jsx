import { useEffect, useMemo, useState } from "react";
import { getScheduleSlotsByDate } from "../../services/scheduleSlotService";
import { publicBookStudent } from "../../services/classSessionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function PublicAgendamento() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date();
    return hoje.toISOString().split("T")[0];
  });

  const [horarios, setHorarios] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [loadingAgendamento, setLoadingAgendamento] = useState(false);
  const [slotSelecionadoId, setSlotSelecionadoId] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  function limparMensagens() {
    setMensagem("");
    setErro("");
  }

  function normalizarMensagemErro(mensagemErro) {
    if (!mensagemErro || typeof mensagemErro !== "string") {
      return "Não foi possível realizar o agendamento.";
    }

    if (mensagemErro.includes("Aluno não encontrado")) {
      return "Seu cadastro não foi encontrado. Entre em contato com a clínica para liberar seu agendamento.";
    }

    if (mensagemErro.includes("não possui plano vinculado")) {
      return "Seu cadastro foi localizado, mas ainda não há plano vinculado. Entre em contato com a clínica.";
    }

    if (mensagemErro.includes("horário que já passou")) {
      return "Esse horário não está mais disponível porque já passou. Escolha outro horário.";
    }

    if (mensagemErro.includes("já possui uma aula agendada neste dia")) {
      return "Você já possui uma aula agendada nesta data.";
    }

    if (mensagemErro.includes("já atingiu o limite")) {
      return "Você já atingiu o limite de aulas permitido no seu plano nesta semana.";
    }

    if (mensagemErro.includes("Limite de alunos da turma atingido")) {
      return "Essa turma já atingiu o limite de alunos. Escolha outro horário.";
    }

    if (mensagemErro.includes("desativado para esta data")) {
      return "Esse horário não está disponível nesta data. Escolha outro.";
    }

    return mensagemErro;
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function carregarHorarios() {
    try {
      setLoadingHorarios(true);

      const data = await getScheduleSlotsByDate(dataSelecionada);
      console.log("Horários recebidos:", data);
      setHorarios(data);
      setErro("");
    } catch (error) {
      console.error("Erro ao carregar horários:", error);
      setErro("Não foi possível carregar os horários disponíveis.");
    } finally {
      setLoadingHorarios(false);
    }
  }

  async function handleAgendar(slotId) {
    if (loadingAgendamento) return;

    if (!formData.fullName.trim()) {
      setErro("Informe seu nome.");
      return;
    }

    if (!formData.phone.trim()) {
      setErro("Informe seu telefone.");
      return;
    }

    if (!formData.email.trim()) {
      setErro("Informe seu e-mail.");
      return;
    }

    try {
      setLoadingAgendamento(true);
      setSlotSelecionadoId(slotId);
      limparMensagens();

      const resposta = await publicBookStudent({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        scheduleSlotId: slotId,
        classDate: `${dataSelecionada}T00:00:00.000Z`,
      });

      console.log("Resposta do agendamento:", resposta);

      const horarioSelecionado = horarios.find(
        (horario) => horario.id === slotId || horario.Id === slotId
      );

      const dataFormatada = new Date(
        `${dataSelecionada}T00:00:00`
      ).toLocaleDateString("pt-BR");

      const startTime =
        horarioSelecionado?.startTime ?? horarioSelecionado?.StartTime;
      const endTime =
        horarioSelecionado?.endTime ?? horarioSelecionado?.EndTime;

      const horarioFormatado =
        startTime && endTime
          ? `${String(startTime).slice(0, 5)} às ${String(endTime).slice(0, 5)}`
          : "horário selecionado";

      setMensagem(
        `Aula agendada com sucesso! Sua reserva foi confirmada para ${dataFormatada}, ${horarioFormatado}.`
      );

      await carregarHorarios();
    } catch (error) {
      console.error("Erro ao realizar agendamento:", error);
      console.error("Resposta do backend:", error?.response?.data);

      const mensagemErro =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Não foi possível realizar o agendamento.";

      setErro(normalizarMensagemErro(mensagemErro));
    } finally {
      setLoadingAgendamento(false);
      setSlotSelecionadoId(null);
    }
  }

  useEffect(() => {
    carregarHorarios();
  }, [dataSelecionada]);

  const horariosDisponiveis = useMemo(() => {
    const agora = new Date();

    return horarios.filter((horario) => {
      const isActive = horario.isActive ?? horario.IsActive ?? false;
      const isAvailable = horario.isAvailable ?? horario.IsAvailable ?? true;
      const startTime = horario.startTime ?? horario.StartTime;

      if (!isActive) return false;
      if (!isAvailable) return false;
      if (!startTime) return false;

      const [ano, mes, dia] = dataSelecionada.split("-").map(Number);
      const [hora, minuto] = String(startTime)
        .slice(0, 5)
        .split(":")
        .map(Number);

      const inicioHorario = new Date(ano, mes - 1, dia, hora, minuto, 0);

      return inicioHorario > agora;
    });
  }, [horarios, dataSelecionada]);

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="space-y-6 p-4 sm:p-6">
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Agende sua aula
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Preencha seus dados, escolha a data e selecione um horário
                disponível.
              </p>
            </div>

            {mensagem && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {mensagem}
              </div>
            )}

            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <input
                  type="text"
                  name="fullName"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                  placeholder="Digite seu nome"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={loadingAgendamento}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <input
                  type="text"
                  name="phone"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                  placeholder="Digite seu telefone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loadingAgendamento}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <input
                  type="email"
                  name="email"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                  placeholder="Digite seu e-mail"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loadingAgendamento}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <input
                type="date"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                disabled={loadingAgendamento}
              />
            </div>

            <div className="space-y-3">
              <div>
                <h2 className="text-base font-semibold sm:text-lg">
                  Horários disponíveis
                </h2>
                <p className="text-sm text-muted-foreground">
                  Escolha abaixo o horário que deseja agendar.
                </p>
              </div>

              {loadingHorarios ? (
                <p className="text-sm text-muted-foreground">
                  Carregando horários...
                </p>
              ) : horariosDisponiveis.length === 0 ? (
                <div className="rounded-lg border bg-background px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum horário disponível para a data selecionada.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {horariosDisponiveis.map((horario) => {
                    const horarioId = horario.id ?? horario.Id;
                    const startTime = horario.startTime ?? horario.StartTime;
                    const endTime = horario.endTime ?? horario.EndTime;
                    const notes = horario.notes ?? horario.Notes;

                    const estaAgendandoNesteSlot =
                      loadingAgendamento && slotSelecionadoId === horarioId;

                    return (
                      <div
                        key={horarioId}
                        className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">
                            {String(startTime).slice(0, 5)} às{" "}
                            {String(endTime).slice(0, 5)}
                          </p>

                          {notes && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              Observação: {notes}
                            </p>
                          )}
                        </div>

                        <Button
                          onClick={() => handleAgendar(horarioId)}
                          disabled={loadingAgendamento}
                          className="w-full sm:w-auto"
                        >
                          {estaAgendandoNesteSlot ? "Agendando..." : "Agendar"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PublicAgendamento;