import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import {
  assignPlanToStudent,
  createStudent,
  deactivateStudent,
  getStudents,
  reactivateStudent,
  updateStudent,
} from "../../services/studentService";
import { getPlans } from "../../services/planService";
import { getStudentFixedSchedules } from "../../services/studentFixedScheduleService";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const initialFormData = {
  fullName: "",
  phone: "",
  email: "",
  birthDate: "",
  notes: "",
};

function formatDateForInput(dateValue) {
  if (!dateValue) return "";
  return String(dateValue).split("T")[0];
}

function formatDateToPtBr(dateValue) {
  if (!dateValue) return "-";

  const [year, month, day] = String(dateValue).split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

function formatDayOfWeek(dayOfWeek) {
  const days = {
    0: "Domingo",
    1: "Segunda",
    2: "Terça",
    3: "Quarta",
    4: "Quinta",
    5: "Sexta",
    6: "Sábado",
  };

  return days[dayOfWeek] ?? dayOfWeek;
}

function formatTime(timeValue) {
  if (!timeValue) return "-";
  return String(timeValue).slice(0, 5);
}

function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [plans, setPlans] = useState([]);
  const [planSelections, setPlanSelections] = useState({});
  const [fixedSchedules, setFixedSchedules] = useState({});

  const [formData, setFormData] = useState(initialFormData);

  async function fetchFixedSchedules(studentId) {
    try {
      const data = await getStudentFixedSchedules(studentId);

      setFixedSchedules((prev) => ({
        ...prev,
        [studentId]: data,
      }));
    } catch (error) {
      console.error("Erro ao buscar horários fixos:", error);

      setFixedSchedules((prev) => ({
        ...prev,
        [studentId]: [],
      }));
    }
  }

  async function fetchStudents() {
    try {
      setLoading(true);
      const data = await getStudents();
      setStudents(data);
      setErro("");

      data.forEach((student) => {
        fetchFixedSchedules(student.id);
      });
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
      setErro("Não foi possível carregar os alunos.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlans() {
    try {
      const data = await getPlans();
      const activePlans = data.filter((plan) => plan.isActive);
      setPlans(activePlans);
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
      setErro("Não foi possível carregar os planos.");
    }
  }

  useEffect(() => {
    fetchStudents();
    fetchPlans();
  }, []);

  function handlePlanSelection(studentId, planId) {
    setPlanSelections((prev) => ({
      ...prev,
      [studentId]: planId,
    }));
  }

  async function handleAssignPlan(studentId) {
    const selectedPlanId = planSelections[studentId];

    if (!selectedPlanId) {
      alert("Selecione um plano antes de vincular.");
      return;
    }

    try {
      await assignPlanToStudent(studentId, Number(selectedPlanId));
      await fetchStudents();

      setPlanSelections((prev) => ({
        ...prev,
        [studentId]: "",
      }));

      alert("Plano vinculado com sucesso!");
    } catch (error) {
      console.error("Erro ao vincular plano:", error);
      setErro("Não foi possível vincular o plano.");
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetForm() {
    setFormData(initialFormData);
    setEditingId(null);
  }

  function handleEdit(student) {
    setEditingId(student.id);
    setFormData({
      fullName: student.fullName || "",
      phone: student.phone || "",
      email: student.email || "",
      birthDate: formatDateForInput(student.birthDate),
      notes: student.notes || "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErro("");

    try {
      if (editingId) {
        await updateStudent(editingId, formData);
      } else {
        await createStudent(formData);
      }

      resetForm();
      await fetchStudents();
    } catch (error) {
      console.error("Erro ao salvar aluno:", error);

      const mensagemErro =
        error?.response?.data || "Não foi possível salvar o aluno.";

      setErro(mensagemErro);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id) {
    const confirmar = window.confirm("Deseja desativar este aluno?");

    if (!confirmar) return;

    try {
      await deactivateStudent(id);

      if (editingId === id) {
        resetForm();
      }

      await fetchStudents();
    } catch (error) {
      console.error("Erro ao desativar aluno:", error);
      setErro("Não foi possível desativar o aluno.");
    }
  }

  async function handleReactivate(id) {
    const confirmar = window.confirm("Deseja reativar este aluno?");

    if (!confirmar) return;

    try {
      await reactivateStudent(id);
      await fetchStudents();
    } catch (error) {
      console.error("Erro ao reativar aluno:", error);
      setErro("Não foi possível reativar o aluno.");
    }
  }

  const filteredStudents = students.filter((student) => {
    if (statusFilter === "inactive") return !student.isActive;
    if (statusFilter === "all") return true;
    return student.isActive;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Alunos
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Cadastre, edite, filtre e gerencie os alunos da clínica.
          </p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>
              {editingId ? "Editar aluno" : "Cadastrar aluno"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome completo</label>
                  <Input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Digite o e-mail do aluno"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Data de nascimento
                  </label>
                  <Input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Digite observações sobre o aluno"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving
                    ? "Salvando..."
                    : editingId
                    ? "Atualizar aluno"
                    : "Cadastrar aluno"}
                </Button>

                {editingId && (
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancelar edição
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                className="w-full sm:w-auto"
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                Todos
              </Button>

              <Button
                type="button"
                className="w-full sm:w-auto"
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => setStatusFilter("active")}
              >
                Ativos
              </Button>

              <Button
                type="button"
                className="w-full sm:w-auto"
                variant={statusFilter === "inactive" ? "default" : "outline"}
                onClick={() => setStatusFilter("inactive")}
              >
                Inativos
              </Button>
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

        {loading && (
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <p>Carregando alunos...</p>
            </CardContent>
          </Card>
        )}

        {!loading && !erro && filteredStudents.length === 0 && (
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <p>Nenhum aluno encontrado para esse filtro.</p>
            </CardContent>
          </Card>
        )}

        {!loading && filteredStudents.length > 0 && (
          <>
            <div className="space-y-4 md:hidden">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="rounded-2xl">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{student.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {student.id}
                        </p>
                      </div>

                      {student.isActive ? (
                        <Badge>Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Telefone:</span>{" "}
                        {student.phone}
                      </p>
                      <p>
                        <span className="font-medium">E-mail:</span>{" "}
                        {student.email || "-"}
                      </p>
                      <p>
                        <span className="font-medium">Nascimento:</span>{" "}
                        {formatDateToPtBr(student.birthDate)}
                      </p>
                      <p>
                        <span className="font-medium">Observações:</span>{" "}
                        {student.notes || "-"}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Horários fixos</p>

                      {fixedSchedules[student.id]?.length > 0 ? (
                        <div className="rounded-xl border p-3">
                          <div className="space-y-1">
                            {fixedSchedules[student.id].map((fixedSchedule) => (
                              <p key={fixedSchedule.id}>
                                {formatDayOfWeek(fixedSchedule.dayOfWeek)} -{" "}
                                {formatTime(fixedSchedule.startTime)} às{" "}
                                {formatTime(fixedSchedule.endTime)}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          Nenhum horário fixo
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Plano atual</p>
                      {student.planId ? (
                        <div className="rounded-xl border p-3">
                          <div className="flex flex-col text-sm">
                            <span>{student.planName}</span>
                            <span className="text-muted-foreground">
                              {student.planPeriodicity}
                            </span>
                            <span className="font-medium">
                              {Number(student.planPrice).toLocaleString(
                                "pt-BR",
                                {
                                  style: "currency",
                                  currency: "BRL",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p>Sem plano</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Vincular plano</p>

                      {student.isActive ? (
                        <div className="space-y-2">
                          <Select
                            value={planSelections[student.id] || ""}
                            onValueChange={(value) =>
                              handlePlanSelection(student.id, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                            <SelectContent>
                              {plans.map((plan) => (
                                <SelectItem
                                  key={plan.id}
                                  value={String(plan.id)}
                                >
                                  {plan.name} | {plan.periodicity} |{" "}
                                  {Number(plan.price).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleAssignPlan(student.id)}
                          >
                            {student.planId ? "Trocar plano" : "Vincular"}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleEdit(student)}
                      >
                        Editar
                      </Button>

                      {student.isActive ? (
                        <Button
                          type="button"
                          variant="destructive"
                          className="w-full"
                          onClick={() => handleDeactivate(student.id)}
                        >
                          Desativar
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-primary text-primary hover:bg-primary/10"
                          onClick={() => handleReactivate(student.id)}
                        >
                          Reativar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="hidden rounded-2xl md:block">
              <CardHeader>
                <CardTitle>Lista de alunos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Nascimento</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead>Horários fixos</TableHead>
                        <TableHead>Plano atual</TableHead>
                        <TableHead>Vincular plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.id}</TableCell>

                          <TableCell className="font-medium">
                            {student.fullName}
                          </TableCell>

                          <TableCell>{student.phone}</TableCell>

                          <TableCell>{student.email || "-"}</TableCell>

                          <TableCell>
                            {formatDateToPtBr(student.birthDate)}
                          </TableCell>

                          <TableCell>{student.notes || "-"}</TableCell>

                          <TableCell className="max-w-[220px] whitespace-normal">
                            {fixedSchedules[student.id]?.length > 0 ? (
                              <div className="flex flex-col gap-1 text-sm">
                                {fixedSchedules[student.id].map((fixedSchedule) => (
                                  <span key={fixedSchedule.id}>
                                    {formatDayOfWeek(fixedSchedule.dayOfWeek)} -{" "}
                                    {formatTime(fixedSchedule.startTime)} às{" "}
                                    {formatTime(fixedSchedule.endTime)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              "Nenhum horário fixo"
                            )}
                          </TableCell>

                          <TableCell className="max-w-[220px] whitespace-normal">
                            {student.planId ? (
                              <div className="flex flex-col text-sm">
                                <span>{student.planName}</span>
                                <span className="text-muted-foreground">
                                  {student.planPeriodicity}
                                </span>
                                <span className="font-medium">
                                  {Number(student.planPrice).toLocaleString(
                                    "pt-BR",
                                    {
                                      style: "currency",
                                      currency: "BRL",
                                    }
                                  )}
                                </span>
                              </div>
                            ) : (
                              "Sem plano"
                            )}
                          </TableCell>

                          <TableCell>
                            {student.isActive ? (
                              <div className="flex min-w-[180px] max-w-[220px] flex-col gap-2">
                                <Select
                                  value={planSelections[student.id] || ""}
                                  onValueChange={(value) =>
                                    handlePlanSelection(student.id, value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um plano" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {plans.map((plan) => (
                                      <SelectItem
                                        key={plan.id}
                                        value={String(plan.id)}
                                      >
                                        {plan.name} | {plan.periodicity} |{" "}
                                        {Number(plan.price).toLocaleString(
                                          "pt-BR",
                                          {
                                            style: "currency",
                                            currency: "BRL",
                                          }
                                        )}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => handleAssignPlan(student.id)}
                                >
                                  {student.planId ? "Trocar plano" : "Vincular"}
                                </Button>
                              </div>
                            ) : (
                              <span>-</span>
                            )}
                          </TableCell>

                          <TableCell>
                            {student.isActive ? (
                              <Badge>Ativo</Badge>
                            ) : (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex min-w-[130px] flex-col gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleEdit(student)}
                              >
                                Editar
                              </Button>

                              {student.isActive ? (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => handleDeactivate(student.id)}
                                >
                                  Desativar
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-primary text-primary hover:bg-primary/10"
                                  onClick={() => handleReactivate(student.id)}
                                >
                                  Reativar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default StudentsList;