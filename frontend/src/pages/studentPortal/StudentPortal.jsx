import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getScheduleSlotsByDate } from "../../services/scheduleSlotService";
import {
  cancelStudentBooking,
  getClassSessions,
  quickBookStudent,
} from "../../services/classSessionService";
import { getPlans } from "../../services/planService";
import { getStudentPaymentHistory } from "../../services/financialService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function StudentPortal() {
  const { user, logout } = useAuth();

  const [abaAtiva, setAbaAtiva] = useState("agendamentos");
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date();
    return hoje.toISOString().split("T")[0];
  });

  const [horarios, setHorarios] = useState([]);
  const [meusAgendamentos, setMeusAgendamentos] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);

  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(false);
  const [loadingPlanos, setLoadingPlanos] = useState(false);
  const [loadingFinanceiro, setLoadingFinanceiro] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  function limparMensagens() {
    setMensagem("");
    setErro("");
  }

  function formatarData(data) {
    if (!data) return "-";

    const novaData = new Date(data);

    return novaData.toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });
  }

  function formatarDataHora(data) {
    if (!data) return "-";

    const novaData = new Date(data);

    return novaData.toLocaleString("pt-BR");
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function carregarHorarios() {
    try {
      setLoadingHorarios(true);
      limparMensagens();

      const data = await getScheduleSlotsByDate(dataSelecionada);
      setHorarios(data);
    } catch (error) {
      console.error("Erro ao carregar horários:", error);
      setErro("Não foi possível carregar os horários disponíveis.");
    } finally {
      setLoadingHorarios(false);
    }
  }

  async function carregarMeusAgendamentos() {
    try {
      setLoadingAgendamentos(true);

      const data = await getClassSessions();

      const agendamentosDoAluno = data
        .filter((aula) =>
          aula.students?.some(
            (student) =>
              student.id === user?.studentId && student.status !== "Cancelled"
          )
        )
        .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

      setMeusAgendamentos(agendamentosDoAluno);
    } catch (error) {
      console.error("Erro ao carregar agendamentos do aluno:", error);
      setErro("Não foi possível carregar seus agendamentos.");
    } finally {
      setLoadingAgendamentos(false);
    }
  }

  async function carregarPlanos() {
    try {
      setLoadingPlanos(true);

      const data = await getPlans();
      setPlanos(data);
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
      setErro("Não foi possível carregar os planos.");
    } finally {
      setLoadingPlanos(false);
    }
  }

  async function carregarFinanceiro() {
    if (!user?.studentId) return;

    try {
      setLoadingFinanceiro(true);

      const data = await getStudentPaymentHistory(user.studentId);
      setFinanceiro(data);
    } catch (error) {
      console.error("Erro ao carregar financeiro:", error);
      setErro("Não foi possível carregar seu histórico financeiro.");
    } finally {
      setLoadingFinanceiro(false);
    }
  }

  async function handleAgendar(slotId) {
    if (!user?.studentId) {
      setErro("Aluno não identificado para agendamento.");
      return;
    }

    try {
      limparMensagens();

      await quickBookStudent({
        studentId: user.studentId,
        scheduleSlotId: slotId,
        classDate: `${dataSelecionada}T00:00:00.000Z`,
      });

      setMensagem("Agendamento realizado com sucesso.");
      await carregarHorarios();
      await carregarMeusAgendamentos();
    } catch (error) {
      console.error("Erro ao agendar aula:", error);

      const mensagemErro =
        error?.response?.data ||
        "Não foi possível realizar o agendamento.";

      setErro(
        typeof mensagemErro === "string"
          ? mensagemErro
          : "Não foi possível realizar o agendamento."
      );
    }
  }

  async function handleCancelarAgendamento(classSessionId) {
    if (!user?.studentId) {
      setErro("Aluno não identificado para cancelamento.");
      return;
    }

    try {
      limparMensagens();

      const resposta = await cancelStudentBooking(classSessionId, user.studentId);

      setMensagem(
        resposta?.message || "Agendamento cancelado com sucesso."
      );

      await carregarMeusAgendamentos();
      await carregarHorarios();
      await carregarFinanceiro();
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);

      const mensagemErro =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Não foi possível cancelar o agendamento.";

      setErro(
        typeof mensagemErro === "string"
          ? mensagemErro
          : "Não foi possível cancelar o agendamento."
      );
    }
  }

  useEffect(() => {
    carregarHorarios();
  }, [dataSelecionada]);

  useEffect(() => {
    if (user?.studentId) {
      carregarMeusAgendamentos();
      carregarFinanceiro();
    }

    carregarPlanos();
  }, [user?.studentId]);

  const horariosDisponiveis = useMemo(() => {
    return horarios.filter((horario) => horario.isAvailable);
  }, [horarios]);

  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Portal do Aluno</h1>
              <p className="text-sm text-muted-foreground">
                Bem-vindo{user?.name ? `, ${user.name}` : ""}. Aqui você pode
                acompanhar seus agendamentos, planos e financeiro.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={abaAtiva === "agendamentos" ? "default" : "outline"}
                onClick={() => setAbaAtiva("agendamentos")}
              >
                Agendamentos
              </Button>

              <Button
                variant={abaAtiva === "planos" ? "default" : "outline"}
                onClick={() => setAbaAtiva("planos")}
              >
                Planos
              </Button>

              <Button
                variant={abaAtiva === "financeiro" ? "default" : "outline"}
                onClick={() => setAbaAtiva("financeiro")}
              >
                Financeiro
              </Button>

              <Button variant="destructive" onClick={logout}>
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>

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

        {abaAtiva === "agendamentos" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Agendar aula</h2>
                  <p className="text-sm text-muted-foreground">
                    Escolha a data e veja os horários disponíveis.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data</label>
                  <input
                    type="date"
                    className="w-full rounded-md border px-3 py-2"
                    value={dataSelecionada}
                    onChange={(e) => setDataSelecionada(e.target.value)}
                  />
                </div>

                {loadingHorarios ? (
                  <p className="text-sm text-muted-foreground">
                    Carregando horários...
                  </p>
                ) : horariosDisponiveis.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum horário disponível para a data selecionada.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {horariosDisponiveis.map((horario) => (
                      <div
                        key={horario.id}
                        className="rounded-xl border p-4 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-medium">
                            {String(horario.startTime).slice(0, 5)} às{" "}
                            {String(horario.endTime).slice(0, 5)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Máximo de alunos:{" "}
                            {horario.maxStudentsOverride || horario.maxStudents}
                          </p>
                          {horario.notes && (
                            <p className="text-sm text-muted-foreground">
                              Observação: {horario.notes}
                            </p>
                          )}
                        </div>

                        <Button onClick={() => handleAgendar(horario.id)}>
                          Agendar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Minhas aulas</h2>
                  <p className="text-sm text-muted-foreground">
                    Veja seus agendamentos atuais.
                  </p>
                </div>

                {loadingAgendamentos ? (
                  <p className="text-sm text-muted-foreground">
                    Carregando agendamentos...
                  </p>
                ) : meusAgendamentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Você ainda não possui aulas agendadas.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {meusAgendamentos.map((agendamento) => (
                      <div
                        key={agendamento.id}
                        className="rounded-xl border p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">
                              {formatarData(agendamento.classDate)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {String(agendamento.startTime).slice(0, 5)} às{" "}
                              {String(agendamento.endTime).slice(0, 5)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Status: {agendamento.status}
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            onClick={() =>
                              handleCancelarAgendamento(agendamento.id)
                            }
                          >
                            Cancelar
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Início da aula: {formatarDataHora(agendamento.startDateTime)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {abaAtiva === "planos" && (
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Planos disponíveis</h2>
                <p className="text-sm text-muted-foreground">
                  Confira os planos cadastrados na clínica.
                </p>
              </div>

              {loadingPlanos ? (
                <p className="text-sm text-muted-foreground">
                  Carregando planos...
                </p>
              ) : planos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum plano encontrado.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {planos.map((plano) => (
                    <div key={plano.id} className="rounded-xl border p-4 space-y-2">
                      <h3 className="font-semibold">{plano.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Periodicidade: {plano.periodicity}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Aulas por semana: {plano.classesPerWeek}
                      </p>
                      <p className="text-base font-medium">
                        {formatarMoeda(plano.price)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {abaAtiva === "financeiro" && (
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Meu financeiro</h2>
                <p className="text-sm text-muted-foreground">
                  Aqui você acompanha apenas seus pagamentos.
                </p>
              </div>

              {loadingFinanceiro ? (
                <p className="text-sm text-muted-foreground">
                  Carregando histórico financeiro...
                </p>
              ) : financeiro.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum registro financeiro encontrado.
                </p>
              ) : (
                <div className="space-y-3">
                  {financeiro.map((item) => (
                    <div
                      key={item.paymentId}
                      className="rounded-xl border p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {item.planName || "Plano não informado"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Referência: {String(item.referenceMonth).padStart(2, "0")}/
                          {item.referenceYear}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Status: {item.status}
                        </p>
                        {item.paidAt && (
                          <p className="text-sm text-muted-foreground">
                            Pago em: {formatarDataHora(item.paidAt)}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">
                            Observações: {item.notes}
                          </p>
                        )}
                      </div>

                      <div className="text-base font-semibold">
                        {formatarMoeda(item.planPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default StudentPortal;