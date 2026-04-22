import { useEffect, useMemo, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import { getScheduleSlots } from "../../services/scheduleSlotService";
import {
  getOverridesByDate,
  createOverride,
  updateOverride,
} from "../../services/scheduleOverrideService";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus } from "lucide-react";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getDayOfWeekFromDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  return localDate.getDay();
}

function formatTime(time) {
  return time?.slice(0, 5) || "";
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

  return days[dayOfWeek] ?? "";
}

function isPastSlot(dateString, startTime) {
  if (!dateString || !startTime) return false;

  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes] = String(startTime)
    .slice(0, 5)
    .split(":")
    .map(Number);

  const slotDateTime = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();

  return slotDateTime <= now;
}

function ScheduleOverrides() {
  const [date, setDate] = useState(getToday());
  const [slots, setSlots] = useState([]);
  const [edited, setEdited] = useState({});
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [savingSlotId, setSavingSlotId] = useState(null);

  const selectedDayOfWeek = useMemo(() => {
    return getDayOfWeekFromDate(date);
  }, [date]);

  const filteredSlots = useMemo(() => {
    return slots
      .filter((slot) => slot.dayOfWeek === selectedDayOfWeek)
      .sort((a, b) => {
        const aPast = isPastSlot(date, a.startTime);
        const bPast = isPastSlot(date, b.startTime);

        if (aPast !== bPast) {
          return aPast ? 1 : -1;
        }

        return a.startTime.localeCompare(b.startTime);
      });
  }, [slots, selectedDayOfWeek, date]);

  useEffect(() => {
    fetchData();
  }, [date]);

  async function fetchData() {
    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      const [slotsData, overridesData] = await Promise.all([
        getScheduleSlots(),
        getOverridesByDate(date),
      ]);

      setSlots(slotsData);

      const map = {};
      overridesData.forEach((override) => {
        map[override.scheduleSlotId] = override;
      });

      setEdited(map);
    } catch (error) {
      console.error("Erro ao carregar Ajustes da Turma:", error);
      setErro("Não foi possível carregar os Ajustes da Turma.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(slotId, field, value) {
    setEdited((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        scheduleSlotId: slotId,
        date,
        [field]: value,
      },
    }));
  }

  async function handleSave(slot) {
    const currentData = edited[slot.id] || {};

    const payload = {
      scheduleSlotId: slot.id,
      date,
      isActive: currentData.isActive ?? slot.isActive,
      maxStudents: currentData.maxStudents ?? slot.maxStudents,
      notes: currentData.notes ?? slot.notes ?? "",
    };

    if (!payload.maxStudents || payload.maxStudents < 1) {
      setErro("O número máximo de alunos deve ser maior que zero.");
      setSucesso("");
      return;
    }

    try {
      setSavingSlotId(slot.id);
      setErro("");
      setSucesso("");

      if (currentData.id) {
        await updateOverride(currentData.id, {
          isActive: payload.isActive,
          maxStudents: payload.maxStudents,
          notes: payload.notes,
        });
      } else {
        await createOverride(payload);
      }

      setSucesso("Ajuste salvo com sucesso.");
      await fetchData();
    } catch (error) {
      console.error("Erro ao salvar ajuste:", error);
      setErro("Não foi possível salvar o ajuste.");
      setSucesso("");
    } finally {
      setSavingSlotId(null);
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ajustes da Turma
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Ajuste vagas e disponibilidade dos horários em uma data específica.
          </p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Selecionar data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-sm space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Dia selecionado:{" "}
              <span className="font-medium text-foreground">
                {getDayName(selectedDayOfWeek)}
              </span>
            </div>
          </CardContent>
        </Card>

        {erro && (
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-red-500">{erro}</p>
            </CardContent>
          </Card>
        )}

        {sucesso && (
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-emerald-600">{sucesso}</p>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <p>Carregando ajustes...</p>
            </CardContent>
          </Card>
        )}

        {!loading && filteredSlots.length === 0 && (
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <p>Não há horários cadastrados para esse dia da semana.</p>
            </CardContent>
          </Card>
        )}

        {!loading && filteredSlots.length > 0 && (
          <div className="grid gap-6 xl:grid-cols-2">
            {filteredSlots.map((slot) => {
              const override = edited[slot.id];

              const isActive = override?.isActive ?? slot.isActive;
              const maxStudents = Number(
                override?.maxStudents ?? slot.maxStudents ?? 1
              );
              const notes = override?.notes ?? slot.notes ?? "";
              const hasStarted = isPastSlot(date, slot.startTime);

              return (
                <Card
                  key={slot.id}
                  className={`rounded-2xl transition hover:shadow-md ${
                    !isActive ? "border-red-200 opacity-80" : ""
                  } ${hasStarted ? "border-muted bg-muted/20" : ""}`}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle>
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </CardTitle>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Horário base do sistema
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {hasStarted && (
                          <Badge variant="secondary">Encerrado</Badge>
                        )}

                        {isActive ? (
                          <Badge>Ativo</Badge>
                        ) : (
                          <Badge variant="destructive">Inativo</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Máximo de alunos
                        </label>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleChange(
                                slot.id,
                                "maxStudents",
                                Math.max(1, maxStudents - 1)
                              )
                            }
                            disabled={maxStudents <= 1}
                            aria-label="Diminuir máximo de alunos"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <Input
                            value={maxStudents}
                            readOnly
                            className="w-20 text-center"
                          />

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleChange(slot.id, "maxStudents", maxStudents + 1)
                            }
                            aria-label="Aumentar máximo de alunos"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Disponibilidade
                        </label>

                        <div className="flex items-center gap-3 rounded-md border p-3">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) =>
                              handleChange(slot.id, "isActive", e.target.checked)
                            }
                          />
                          <span className="text-sm">
                            {isActive ? "Horário disponível" : "Horário desativado"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Observações</label>
                      <Textarea
                        value={notes}
                        onChange={(e) =>
                          handleChange(slot.id, "notes", e.target.value)
                        }
                        placeholder="Ex: turma com criança, atendimento reduzido, não haverá aula..."
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSave(slot)}
                        disabled={savingSlotId === slot.id}
                        className="w-full sm:w-auto"
                      >
                        {savingSlotId === slot.id ? "Salvando..." : "Salvar ajuste"}
                      </Button>
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

export default ScheduleOverrides;