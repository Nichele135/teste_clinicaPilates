import MainLayout from "../../layouts/MainLayout";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getStudents } from "../../services/studentService";
import { getPlans } from "../../services/planService";
import { getClassSessions } from "../../services/classSessionService";

function Dashboard() {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalPlans: 0,
    totalScheduledClasses: 0,
  });

  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  async function loadDashboardMetrics() {
    try {
      setLoadingMetrics(true);

      const [students, plans, classSessions] = await Promise.all([
        getStudents(),
        getPlans(),
        getClassSessions(),
      ]);

      const activeStudents = students.filter((s) => s.isActive);

      const scheduledClasses = classSessions.filter(
        (session) =>
          session.status === "Scheduled" ||
          session.status === "Agendada" ||
          session.status === "Booked"
      );

      setMetrics({
        totalStudents: activeStudents.length,
        totalPlans: plans.length,
        totalScheduledClasses: scheduledClasses.length,
      });
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    } finally {
      setLoadingMetrics(false);
    }
  }

  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Gerencie alunos, planos e agendamentos da clínica.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>Agendamentos</CardTitle>
              <CardDescription>
                Visualize e organize as aulas agendadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                onClick={() => navigate("/class-sessions")}
                className="w-full"
              >
                Acessar
              </Button>
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>Alunos</CardTitle>
              <CardDescription>
                Cadastre, edite e acompanhe os alunos da clínica.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                onClick={() => navigate("/students")}
                className="w-full"
              >
                Acessar
              </Button>
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>Ajustar Agenda</CardTitle>
              <CardDescription>
                Bloqueie ou libere dias completos da agenda.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                onClick={() => navigate("/ajustar-agenda")}
                className="w-full"
              >
                Acessar
              </Button>
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>Planos</CardTitle>
              <CardDescription>
                Gerencie planos e valores.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button onClick={() => navigate("/plans")} className="w-full">
                Acessar
              </Button>
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>Ajustes da Turma</CardTitle>
              <CardDescription>
                Configure exceções de horários.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                onClick={() => navigate("/ajustes-agenda")}
                className="w-full"
              >
                Acessar
              </Button>
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>Financeiro</CardTitle>
              <CardDescription>
                Controle pagamentos e entradas.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button onClick={() => navigate("/financial")} className="w-full">
                Acessar
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Total de Alunos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold sm:text-2xl">
                {loadingMetrics ? "--" : metrics.totalStudents}
              </p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>Planos Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold sm:text-2xl">
                {loadingMetrics ? "--" : metrics.totalPlans}
              </p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>Aulas Agendadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold sm:text-2xl">
                {loadingMetrics ? "--" : metrics.totalScheduledClasses}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default Dashboard;