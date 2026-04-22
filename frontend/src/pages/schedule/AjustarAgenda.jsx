import { useEffect, useMemo, useState } from "react";
import MainLayout from "../../layouts/MainLayout";

import {
  getScheduleSlotsByDate,
  createScheduleOverride,
  blockScheduleRange,
  blockFullDay,
  removeScheduleOverride,
} from "../../services/scheduleSlotService";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Ban, Unlock } from "lucide-react";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getDayOfWeekFromDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  return localDate.getDay();
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

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

function AjustarAgenda() {
  const [date, setDate] = useState(getToday());
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const [range, setRange] = useState({
    startTime: "11:00",
    endTime: "14:00",
  });

  const selectedDayOfWeek = useMemo(() => {
    return getDayOfWeekFromDate(date);
  }, [date]);

  const allBlocked = useMemo(() => {
    return slots.length > 0 && slots.every((slot) => slot.isActive === false);
  }, [slots]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getScheduleSlotsByDate(date);

      const ordered = [...data].sort((a, b) =>
        String(a.startTime).localeCompare(String(b.startTime))
      );

      setSlots(ordered);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar agenda");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [date]);

  async function blockSlot(slot) {
    try {
      await createScheduleOverride({
        scheduleSlotId: slot.id,
        date,
        isActive: false,
        maxStudents: slot.maxStudents ?? 1,
        notes: slot.overrideNotes ?? "",
      });

      await loadData();
    } catch (error) {
      console.error("Erro ao bloquear horário:", error);
      alert("Não foi possível bloquear o horário.");
    }
  }

  async function unblockSlot(slot) {
    try {
      if (slot.overrideId) {
        await removeScheduleOverride(slot.overrideId);
      } else {
        await createScheduleOverride({
          scheduleSlotId: slot.id,
          date,
          isActive: true,
          maxStudents: slot.maxStudents ?? 1,
          notes: "",
        });
      }

      await loadData();
    } catch (error) {
      console.error("Erro ao liberar horário:", error);
      alert("Não foi possível liberar o horário.");
    }
  }

  async function blockRangeAction() {
    try {
      await blockScheduleRange({
        date,
        startTime: `${range.startTime}:00`,
        endTime: `${range.endTime}:00`,
        notes: "Intervalo bloqueado",
      });

      await loadData();
    } catch (error) {
      console.error("Erro ao bloquear intervalo:", error);
      alert("Não foi possível bloquear o intervalo.");
    }
  }

  async function blockFullDayAction() {
    try {
      await blockFullDay({
        date,
        notes: "Dia bloqueado",
      });

      await loadData();
    } catch (error) {
      console.error("Erro ao bloquear dia inteiro:", error);
      alert("Não foi possível bloquear o dia inteiro.");
    }
  }

  async function releaseFullDayAction() {
    try {
      const overrideIds = slots
        .map((slot) => slot.overrideId)
        .filter((id) => id !== null && id !== undefined);

      for (const overrideId of overrideIds) {
        await removeScheduleOverride(overrideId);
      }

      await loadData();
    } catch (error) {
      console.error("Erro ao liberar dia inteiro:", error);
      alert("Não foi possível liberar o dia inteiro.");
    }
  }

  function formatTime(time) {
    return time?.slice(0, 5) || "";
  }

  return (
    <MainLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Ajustar Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie os horários de uma data específica.
          </p>
        </div>

        {/* DATA */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Selecionar data</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <CalendarDays className="shrink-0" />

              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full sm:max-w-xs"
              />

              <Button className="w-full sm:w-auto" onClick={loadData}>
                Atualizar
              </Button>
            </div>

            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <p className="text-sm text-muted-foreground">Dia selecionado</p>
              <p className="font-semibold">
                {getDayName(selectedDayOfWeek)}, {formatDate(date)}
              </p>
            </div>

            {slots.length > 0 && (
              <div>
                {allBlocked ? (
                  <Badge variant="destructive">Dia inteiro bloqueado</Badge>
                ) : (
                  <Badge>Dia com horários disponíveis</Badge>
                )}
              </div>
            )}

          </CardContent>
        </Card>

        {/* AÇÕES */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="w-full sm:w-auto"
              variant="destructive"
              onClick={blockFullDayAction}
            >
              <Ban className="mr-2 h-4 w-4" />
              Bloquear dia inteiro
            </Button>

            <Button
              className="w-full sm:w-auto"
              variant="outline"
              onClick={releaseFullDayAction}
            >
              <Unlock className="mr-2 h-4 w-4" />
              Liberar dia inteiro
            </Button>
          </CardContent>
        </Card>

        {/* MOBILE LISTA */}
        <div className="md:hidden space-y-3">
          {slots.map((slot) => (
            <Card key={slot.id}>
              <CardContent className="p-4 space-y-3">
                <p className="font-medium">
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </p>

                <Badge variant={slot.isActive ? "default" : "destructive"}>
                  {slot.isActive ? "Disponível" : "Bloqueado"}
                </Badge>

                {slot.isActive ? (
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => blockSlot(slot)}
                  >
                    Bloquear
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => unblockSlot(slot)}
                  >
                    Liberar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* DESKTOP TABELA */}
        <Card className="hidden md:block rounded-2xl">
          <CardHeader>
            <CardTitle>Horários do dia</CardTitle>
            <CardDescription>
              Clique para bloquear ou liberar horários específicos.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p>Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {slots.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell>
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={slot.isActive ? "default" : "destructive"}
                        >
                          {slot.isActive ? "Disponível" : "Bloqueado"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        {slot.isActive ? (
                          <Button
                            variant="destructive"
                            onClick={() => blockSlot(slot)}
                          >
                            Bloquear
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => unblockSlot(slot)}
                          >
                            Liberar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {slots.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        Nenhum horário encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </MainLayout>
  );
}

export default AjustarAgenda;