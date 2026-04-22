import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import StudentsList from "../pages/students/StudentsList";
import PrivateRoute from "./PrivateRoute";
import PlansList from "../pages/plans/PlansList";
import ClassSessionsList from "../pages/classSessions/ClassSessionsList";
import ScheduleOverrides from "../pages/scheduleOverrides/ScheduleOverrides";
import Financeiro from "@/pages/financial/Financeiro";
import AjustarAgenda from "@/pages/schedule/AjustarAgenda";
import StudentPortal from "@/pages/studentPortal/StudentPortal";
import UsersAccess from "@/pages/usersAccess/UsersAccess";

// 🔥 ROTA PÚBLICA
import PublicAgendamento from "@/pages/publicBooking/PublicAgendamento";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* 🔥 ROTA PÚBLICA DO ALUNO */}
        <Route path="/agendar" element={<PublicAgendamento />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/students"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <StudentsList />
            </PrivateRoute>
          }
        />

        <Route
          path="/ajustes-agenda"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <ScheduleOverrides />
            </PrivateRoute>
          }
        />

        <Route
          path="/plans"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <PlansList />
            </PrivateRoute>
          }
        />

        <Route
          path="/ajustar-agenda"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AjustarAgenda />
            </PrivateRoute>
          }
        />

        <Route
          path="/class-sessions"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <ClassSessionsList />
            </PrivateRoute>
          }
        />

        <Route
          path="/financial"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <Financeiro />
            </PrivateRoute>
          }
        />

        <Route
          path="/users-access"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <UsersAccess />
            </PrivateRoute>
          }
        />

        <Route
          path="/portal-aluno"
          element={
            <PrivateRoute allowedRoles={["aluno"]}>
              <StudentPortal />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;