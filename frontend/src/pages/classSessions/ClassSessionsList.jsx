import { useEffect, useMemo, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import { getStudents } from "../../services/studentService";
import { getScheduleSlotsByDate } from "../../services/scheduleSlotService";
import {
  getClassSessions,
  quickBookStudent,
  removeStudentFromSession,
  getOverridesByDate,
} from "../../services/classSessionService";
import { traduzirStatus } from "../../utils/statusUtils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function formatTime(time) {
  if (!time) return "";
  return time.slice(0, 5);
}

function getWeekdayLabel(dateString) {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  return localDate
    .toLocaleDateString("pt-BR", { weekday: "long" })
    .replace("-feira", "")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatDateWithWeekday(dateString) {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  const weekday = localDate
    .toLocaleDateString("pt-BR", { weekday: "long" })
    .replace("-feira", "");

  const dayMonth = localDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  return `${weekday} • ${dayMonth}`;
}

function ClassSessionsList() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [students, setStudents] = useState([]);
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [classSessions, setClassSessions] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSlotId, setBookingSlotId] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [removingStudentKey, setRemovingStudentKey] = useState("");

  async function fetchInitialData() {
    try {
      setLoading(true);

      const [studentsData, sessionsData] = await Promise.all([
        getStudents(),
        getClassSessions(),
      ]);

      setStudents(studentsData);
      setClassSessions(sessionsData);
      setErro("");
    } catch (error) {
      console.error("Erro ao carregar dados dos agendamentos:", error);
      setErro("Não foi possível carregar os dados da agenda.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchScheduleSlotsByDate(date) {
    try {
      setLoadingSlots(true);

      const data = await getScheduleSlotsByDate(date);
      setScheduleSlots(data);
      setErro("");
    } catch (error) {
      console.error("Erro ao carregar horários da data:", error);
      setErro("Não foi possível carregar os horários da data selecionada.");
      setScheduleSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function refreshPageData(date = selectedDate) {
    try {
      const [sessionsData] = await Promise.all([getClassSessions()]);
      setClassSessions(sessionsData);
      await fetchScheduleSlotsByDate(date);
    } catch (error) {
      console.error("Erro ao atualizar dados da agenda:", error);
      setErro("Não foi possível atualizar os dados da agenda.");
    }
  }

  async function handleRemoveStudent(classSessionId, studentId, studentName) {
    const confirmar = window.confirm(
      `Deseja remover o aluno ${studentName} deste horário?`
    );

    if (!confirmar) return;

    try {
      setRemovingStudentKey(`${classSessionId}-${studentId}`);
      setErro("");
      setSucesso("");

      await removeStudentFromSession(classSessionId, studentId);

      setSucesso("Aluno removido do horário com sucesso.");
      await refreshPageData();
    } catch (error) {
      console.error("Erro ao remover aluno do horário:", error);

      const mensagem =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.response?.data ||
        "Não foi possível remover o aluno deste horário.";

      setErro(
        typeof mensagem === "string"
          ? mensagem
          : "Não foi possível remover o aluno deste horário."
      );
    } finally {
      setRemovingStudentKey("");
    }
  }

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    async function fetchOverrides() {
      if (!selectedDate) return;

      try {
        const data = await getOverridesByDate(selectedDate);
        setOverrides(data);
      } catch (error) {
        console.error("Erro ao buscar overrides:", error);
        setOverrides([]);
      }
    }

    fetchOverrides();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      fetchScheduleSlotsByDate(selectedDate);
    }
  }, [selectedDate]);

  const activeStudents = useMemo(() => {
    return students.filter((student) => student.isActive);
  }, [students]);

  const selectedWeekdayLabel = useMemo(() => {
    return getWeekdayLabel(selectedDate);
  }, [selectedDate]);

  function getOverride(slotId) {
    return overrides.find((override) => override.scheduleSlotId === slotId);
  }

  function isPastSlot(dateString, startTime) {
    if (!dateString || !startTime) return false;

    const [year, month, day] = dateString.split("-").map(Number);
    const [hours, minutes] = startTime.slice(0, 5).split(":").map(Number);

    const slotDateTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();

    return slotDateTime <= now;
  }

  const sessionsBySlotId = useMemo(() => {
    const map = {};

    classSessions.forEach((session) => {
      const sessionDate = session.classDate?.split("T")[0];

      if (sessionDate === selectedDate) {
        map[session.scheduleSlotId] = session;
      }
    });

    return map;
  }, [classSessions, selectedDate]);

  const availableSlots = useMemo(() => {
    const sortedByTime = [...scheduleSlots].sort((a, b) =>
      (a.startTime || "").localeCompare(b.startTime || "")
    );

    return sortedByTime.sort((a, b) => {
      const sessionA = sessionsBySlotId[a.id];
      const sessionB = sessionsBySlotId[b.id];

      const overrideA = getOverride(a.id);
      const overrideB = getOverride(b.id);

      const isBlockedA = overrideA ? !overrideA.isActive : false;
      const isBlockedB = overrideB ? !overrideB.isActive : false;

      const maxStudentsA = overrideA?.maxStudents ?? a.maxStudents;
      const maxStudentsB = overrideB?.maxStudents ?? b.maxStudents;

      const totalStudentsA = sessionA?.totalStudents ?? 0;
      const totalStudentsB = sessionB?.totalStudents ?? 0;

      const isFullA = totalStudentsA >= maxStudentsA;
      const isFullB = totalStudentsB >= maxStudentsB;

      const hasStartedA = isPastSlot(selectedDate, a.startTime);
      const hasStartedB = isPastSlot(selectedDate, b.startTime);

      function getPriority({ isBlocked, isFull, hasStarted, totalStudents }) {
        if (hasStarted) return 5;
        if (isBlocked) return 4;
        if (isFull) return 3;
        if (totalStudents > 0) return 2;
        return 1;
      }

      const priorityA = getPriority({
        isBlocked: isBlockedA,
        isFull: isFullA,
        hasStarted: hasStartedA,
        totalStudents: totalStudentsA,
      });

      const priorityB = getPriority({
        isBlocked: isBlockedB,
        isFull: isFullB,
        hasStarted: hasStartedB,
        totalStudents: totalStudentsB,
      });

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return (a.startTime || "").localeCompare(b.startTime || "");
    });
  }, [scheduleSlots, sessionsBySlotId, overrides, selectedDate]);

  const sessionsGroupedByDate = useMemo(() => {
    const map = {};

    classSessions.forEach((session) => {
      const date = session.classDate?.split("T")[0];
      if (!date) return;

      if (!map[date]) {
        map[date] = 0;
      }

      map[date]++;
    });

    return map;
  }, [classSessions]);

  const sortedDates = useMemo(() => {
    return Object.keys(sessionsGroupedByDate).sort();
  }, [sessionsGroupedByDate]);

  function handleStudentSelection(slotId, studentId) {
    setSelectedStudents((prev) => ({
      ...prev,
      [slotId]: studentId,
    }));
  }

  async function handleQuickBook(slotId) {
    const studentId = selectedStudents[slotId];

    if (!studentId) {
      alert("Selecione um aluno antes de agendar.");
      return;
    }

    try {
      setBookingSlotId(slotId);
      setErro("");
      setSucesso("");

      await quickBookStudent({
        studentId: Number(studentId),
        scheduleSlotId: slotId,
        classDate: `${selectedDate}T00:00:00Z`,
      });

      setSucesso("Aluno agendado com sucesso.");
      setSelectedStudents((prev) => ({
        ...prev,
        [slotId]: "",
      }));

      await refreshPageData();
    } catch (error) {
      console.error("Erro ao agendar aluno:", error);

      const mensagem =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.response?.data ||
        "Não foi possível agendar o aluno.";

      setErro(
        typeof mensagem === "string"
          ? mensagem
          : "Não foi possível agendar o aluno."
      );
    } finally {
      setBookingSlotId(null);
    }
  }

  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Agendamentos
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Gerencie os alunos agendados em cada horário.
          </p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Datas com agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedDates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum agendamento encontrado.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {sortedDates.map((date) => {
                  const total = sessionsGroupedByDate[date];
                  const isSelected = selectedDate === date;

                  return (
                    <Button
                      key={date}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => setSelectedDate(date)}
                      className="h-auto rounded-xl px-3 py-2 text-xs sm:text-sm"
                    >
                      {formatDateWithWeekday(date)} ({total})
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Filtrar por data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data da aula</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dia da semana</label>
                <div className="rounded-md border bg-primary/10 px-4 py-2 font-semibold text-primary">
                  {selectedWeekdayLabel || "-"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {erro && (
          <Card className="rounded-2xl border-red-200">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-red-500">{erro}</p>
            </CardContent>
          </Card>
        )}

        {sucesso && (
          <Card className="rounded-2xl border-emerald-200">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-emerald-600">{sucesso}</p>
            </CardContent>
          </Card>
        )}

        {(loading || loadingSlots) && (
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <p>Carregando agenda...</p>
            </CardContent>
          </Card>
        )}

        {!loading && !loadingSlots && availableSlots.length === 0 && (
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <p>Não há horários disponíveis para essa data.</p>
            </CardContent>
          </Card>
        )}

        {!loading && !loadingSlots && availableSlots.length > 0 && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {availableSlots.map((slot) => {
              const session = sessionsBySlotId[slot.id];
              const totalStudents = session?.totalStudents ?? 0;
              const studentsInClass = session?.students ?? [];
              const override = getOverride(slot.id);
              const isBlocked = override ? !override.isActive : false;
              const maxStudents = override?.maxStudents ?? slot.maxStudents;
              const isFull = totalStudents >= maxStudents;
              const hasStarted = isPastSlot(selectedDate, slot.startTime);

              return (
                <Card
                  key={slot.id}
                  className={`rounded-2xl transition hover:shadow-md ${
                    isBlocked
                      ? "border-slate-300 bg-slate-100/60"
                      : isFull
                      ? "border-red-200 bg-red-50/30"
                      : hasStarted
                      ? "border-muted bg-muted/20"
                      : totalStudents > 0
                      ? "border-primary/20"
                      : ""
                  }`}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <CardTitle className="text-lg sm:text-xl">
                          {formatTime(slot.startTime)} -{" "}
                          {formatTime(slot.endTime)}
                        </CardTitle>

                        <p className="mt-2 text-sm">
                          <span className="font-semibold">{totalStudents}</span>{" "}
                          / {maxStudents} alunos
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {override?.notes || slot.notes || "Sem observações"}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isBlocked ? (
                          <Badge variant="secondary">Indisponível</Badge>
                        ) : isFull ? (
                          <Badge variant="destructive">Turma lotada</Badge>
                        ) : hasStarted ? (
                          <Badge variant="secondary">Horário encerrado</Badge>
                        ) : totalStudents > 0 ? (
                          <Badge variant="outline">Com alunos</Badge>
                        ) : (
                          <Badge variant="outline">Disponível</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium">
                        Selecionar aluno
                      </label>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="flex-1">
                          <Select
                            value={selectedStudents[slot.id] || ""}
                            onValueChange={(value) =>
                              handleStudentSelection(slot.id, value)
                            }
                            disabled={isBlocked || isFull || hasStarted}
                          >
                            <SelectTrigger
                              className={
                                isBlocked || hasStarted
                                  ? "bg-muted text-muted-foreground"
                                  : ""
                              }
                            >
                              <SelectValue
                                placeholder={
                                  isBlocked
                                    ? "Horário bloqueado"
                                    : hasStarted
                                    ? "Horário encerrado"
                                    : "Escolha um aluno"
                                }
                              />
                            </SelectTrigger>

                            <SelectContent>
                              {activeStudents.map((student) => (
                                <SelectItem
                                  key={student.id}
                                  value={String(student.id)}
                                >
                                  {student.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          type="button"
                          onClick={() => handleQuickBook(slot.id)}
                          disabled={
                            bookingSlotId === slot.id ||
                            isFull ||
                            hasStarted ||
                            isBlocked
                          }
                          variant={isBlocked || hasStarted ? "outline" : "default"}
                          className="w-full sm:w-auto"
                        >
                          {bookingSlotId === slot.id
                            ? "Agendando..."
                            : isBlocked
                            ? "Indisponível"
                            : hasStarted
                            ? "Horário encerrado"
                            : isFull
                            ? "Turma lotada"
                            : "Agendar aluno"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">
                        Alunos agendados
                      </h3>

                      {studentsInClass.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum aluno agendado neste horário.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {studentsInClass.map((student) => {
                            const removeKey = `${session.id}-${student.id}`;
                            const isRemoving =
                              removingStudentKey === removeKey;

                            return (
                              <div
                                key={student.id}
                                className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0 space-y-1">
                                  <p className="font-medium">
                                    {student.fullName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {traduzirStatus(student.status)}
                                  </p>
                                </div>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleRemoveStudent(
                                      session.id,
                                      student.id,
                                      student.fullName
                                    )
                                  }
                                  disabled={isRemoving}
                                  className="w-full sm:w-auto"
                                >
                                  {isRemoving ? "Removendo..." : "Remover"}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default ClassSessionsList;