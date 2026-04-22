import { useEffect, useMemo, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import {
  generateFixedSchedule,
  deactivateScheduleSlot,
  activateScheduleSlot,
  getScheduleSlots,
  updateScheduleSlot,
} from "../../services/scheduleSlotService";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function ScheduleSlotsList() {
  const initialGenerateForm = {
    daysOfWeek: [],
    startTime: "08:00",
    endTime: "20:00",
    classDurationMinutes: 50,
    breakMinutes: 10,
    maxStudents: 0,
  };

  const initialEditForm = {
    dayOfWeek: 1,
    startTime: "",
    endTime: "",
    maxStudents: 5,
    notes: "",
  };

  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [savingGenerate, setSavingGenerate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");

  const [generateForm, setGenerateForm] = useState(initialGenerateForm);
  const [editForm, setEditForm] = useState(initialEditForm);

  async function fetchScheduleSlots() {
    try {
      setLoading(true);
      const data = await getScheduleSlots();
      setScheduleSlots(data);
      setErro("");
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
      setErro("Não foi possível carregar os horários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchScheduleSlots();
  }, []);

  function handleDayToggle(day) {
    setGenerateForm((prev) => {
      const exists = prev.daysOfWeek.includes(day);

      return {
        ...prev,
        daysOfWeek: exists
          ? prev.daysOfWeek.filter((item) => item !== day)
          : [...prev.daysOfWeek, day].sort((a, b) => a - b),
      };
    });
  }

  function handleGenerateFormChange(event) {
    const { name, value } = event.target;

    setGenerateForm((prev) => ({
      ...prev,
      [name]:
        name === "classDurationMinutes" ||
        name === "breakMinutes" ||
        name === "maxStudents"
          ? value === ""
            ? 0
            : Number(value)
          : value,
    }));
  }

  async function handleGenerateFixed(event) {
    event.preventDefault();

    if (generateForm.daysOfWeek.length === 0) {
      alert("Selecione pelo menos um dia da semana.");
      return;
    }

    try {
      setSavingGenerate(true);
      setErro("");

      const payload = {
        daysOfWeek: generateForm.daysOfWeek,
        startTime: `${generateForm.startTime}:00`,
        endTime: `${generateForm.endTime}:00`,
        classDurationMinutes: generateForm.classDurationMinutes,
        breakMinutes: generateForm.breakMinutes,
        maxStudents: generateForm.maxStudents,
        notes: "",
      };

      await generateFixedSchedule(payload);

      alert("Horários fixos gerados com sucesso!");
      setGenerateForm(initialGenerateForm);
      await fetchScheduleSlots();
    } catch (error) {
      console.error("Erro ao gerar horários fixos:", error);
      console.error("Detalhes do erro:", error?.response?.data);

      const errors = error?.response?.data?.errors;

      if (errors) {
        const mensagemFormatada = Object.entries(errors)
          .map(([campo, mensagens]) => `${campo}: ${mensagens.join(", ")}`)
          .join(" | ");

        setErro(mensagemFormatada);
      } else {
        setErro(
          error?.response?.data?.title ||
            error?.response?.data?.message ||
            "Não foi possível gerar os horários fixos."
        );
      }
    } finally {
      setSavingGenerate(false);
    }
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditForm((prev) => ({
      ...prev,
      [name]:
        name === "dayOfWeek" || name === "maxStudents"
          ? Number(value)
          : value,
    }));
  }

  function handleEdit(slot) {
    setEditingId(slot.id);
    setEditForm({
      dayOfWeek: slot.dayOfWeek ?? 1,
      startTime: slot.startTime ? slot.startTime.slice(0, 5) : "",
      endTime: slot.endTime ? slot.endTime.slice(0, 5) : "",
      maxStudents: slot.maxStudents ?? 5,
      notes: slot.notes || "",
    });
  }

  function resetEditForm() {
    setEditForm(initialEditForm);
    setEditingId(null);
  }

  async function handleUpdate(event) {
    event.preventDefault();
    setSavingEdit(true);
    setErro("");

    try {
      const payload = {
        ...editForm,
        startTime: editForm.startTime ? `${editForm.startTime}:00` : "",
        endTime: editForm.endTime ? `${editForm.endTime}:00` : "",
      };

      await updateScheduleSlot(editingId, payload);
      resetEditForm();
      await fetchScheduleSlots();
    } catch (error) {
      console.error("Erro ao atualizar horário:", error);
      setErro(
        error?.response?.data?.title ||
          error?.response?.data?.message ||
          error?.response?.data ||
          "Não foi possível atualizar o horário."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeactivate(id) {
    const confirmar = window.confirm("Deseja desativar este horário fixo?");
    if (!confirmar) return;

    try {
      await deactivateScheduleSlot(id);

      if (editingId === id) {
        resetEditForm();
      }

      await fetchScheduleSlots();
    } catch (error) {
      console.error("Erro ao desativar horário:", error);
      setErro("Não foi possível desativar o horário.");
    }
  }

  async function handleActivate(id) {
    const confirmar = window.confirm("Deseja ativar este horário fixo?");
    if (!confirmar) return;

    try {
      await activateScheduleSlot(id);
      await fetchScheduleSlots();
    } catch (error) {
      console.error("Erro ao ativar horário:", error);
      setErro("Não foi possível ativar o horário.");
    }
  }

  function getDayName(dayOfWeek) {
    const days = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];

    return days[dayOfWeek] ?? dayOfWeek;
  }

  function formatTime(time) {
    return time ? time.slice(0, 5) : "-";
  }

  const filteredScheduleSlots = useMemo(() => {
    return scheduleSlots.filter((slot) => {
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? slot.isActive
          : !slot.isActive;

      const matchDay =
        dayFilter === "all" ? true : slot.dayOfWeek === Number(dayFilter);

      return matchStatus && matchDay;
    });
  }, [scheduleSlots, statusFilter, dayFilter]);

  const totalActive = useMemo(() => {
    return scheduleSlots.filter((item) => item.isActive).length;
  }, [scheduleSlots]);

  const dayFilterOptions = [
    { value: "all", label: "Todos" },
    { value: "1", label: "Seg" },
    { value: "2", label: "Ter" },
    { value: "3", label: "Qua" },
    { value: "4", label: "Qui" },
    { value: "5", label: "Sex" },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Horários</h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie os horários padrão da clínica.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de horários</CardDescription>
              <CardTitle className="text-2xl">{scheduleSlots.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Horários ativos</CardDescription>
              <CardTitle className="text-2xl">{totalActive}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gerar horários fixos</CardTitle>
            <CardDescription>
              Defina os horários padrão da clínica.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleGenerateFixed} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hora início</label>
                  <Input
                    type="time"
                    name="startTime"
                    value={generateForm.startTime}
                    onChange={handleGenerateFormChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Hora fim</label>
                  <Input
                    type="time"
                    name="endTime"
                    value={generateForm.endTime}
                    onChange={handleGenerateFormChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Duração da aula (min)
                  </label>
                  <Input
                    type="number"
                    name="classDurationMinutes"
                    value={generateForm.classDurationMinutes}
                    onChange={handleGenerateFormChange}
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Intervalo (min)</label>
                  <Input
                    type="number"
                    name="breakMinutes"
                    value={generateForm.breakMinutes}
                    onChange={handleGenerateFormChange}
                    min="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Máximo de alunos
                  </label>
                  <Input
                    type="number"
                    name="maxStudents"
                    value={generateForm.maxStudents || ""}
                    onChange={handleGenerateFormChange}
                    min="0"
                    placeholder="Automático"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Dias da semana</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((day) => {
                    const selected = generateForm.daysOfWeek.includes(day);

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                      >
                        {getDayName(day)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button type="submit" disabled={savingGenerate}>
                {savingGenerate ? "Gerando..." : "Gerar horários"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {editingId && (
          <Card>
            <CardHeader>
              <CardTitle>Editar horário fixo</CardTitle>
              <CardDescription>
                Altere as informações do horário selecionado.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dia da semana</label>
                    <select
                      name="dayOfWeek"
                      value={editForm.dayOfWeek}
                      onChange={handleEditChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value={0}>Domingo</option>
                      <option value={1}>Segunda-feira</option>
                      <option value={2}>Terça-feira</option>
                      <option value={3}>Quarta-feira</option>
                      <option value={4}>Quinta-feira</option>
                      <option value={5}>Sexta-feira</option>
                      <option value={6}>Sábado</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hora início</label>
                    <Input
                      type="time"
                      name="startTime"
                      value={editForm.startTime}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hora fim</label>
                    <Input
                      type="time"
                      name="endTime"
                      value={editForm.endTime}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Máximo de alunos
                    </label>
                    <Input
                      type="number"
                      name="maxStudents"
                      value={editForm.maxStudents}
                      onChange={handleEditChange}
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Observações</label>
                    <Textarea
                      name="notes"
                      value={editForm.notes}
                      onChange={handleEditChange}
                      placeholder="Digite observações do horário"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={savingEdit}>
                    {savingEdit ? "Salvando..." : "Atualizar horário"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetEditForm}
                  >
                    Cancelar edição
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Visualize os horários pelo status e pelo dia da semana.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">Status:</span>

              <Button
                type="button"
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                Todos
              </Button>

              <Button
                type="button"
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => setStatusFilter("active")}
              >
                Ativos
              </Button>

              <Button
                type="button"
                variant={statusFilter === "inactive" ? "default" : "outline"}
                onClick={() => setStatusFilter("inactive")}
              >
                Inativos
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dia da semana</label>
              <div className="flex flex-wrap gap-2">
                {dayFilterOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={dayFilter === option.value ? "default" : "outline"}
                    onClick={() => setDayFilter(option.value)}
                    className="min-w-[64px]"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {erro && (
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-red-500">{erro}</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <p>Carregando horários...</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Horários fixos cadastrados</CardTitle>
              <CardDescription>
                Lista dos horários padrão da clínica.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Máx. alunos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[240px] text-center">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredScheduleSlots.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell className="font-medium">
                        {getDayName(slot.dayOfWeek)}
                      </TableCell>
                      <TableCell>{formatTime(slot.startTime)}</TableCell>
                      <TableCell>{formatTime(slot.endTime)}</TableCell>
                      <TableCell>{slot.maxStudents}</TableCell>
                      <TableCell>
                        {slot.isActive ? (
                          <Badge>Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="w-[240px]">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-w-[88px]"
                            onClick={() => handleEdit(slot)}
                          >
                            Editar
                          </Button>

                          {slot.isActive ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="min-w-[88px]"
                              onClick={() => handleDeactivate(slot.id)}
                            >
                              Desativar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="min-w-[88px]"
                              onClick={() => handleActivate(slot.id)}
                            >
                              Ativar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredScheduleSlots.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        Nenhum horário encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

export default ScheduleSlotsList;