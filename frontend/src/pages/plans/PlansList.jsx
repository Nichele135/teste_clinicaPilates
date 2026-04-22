import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import {
  activatePlan,
  createPlan,
  deactivatePlan,
  getPlans,
  updatePlan,
} from "../../services/planService";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const initialFormData = {
  name: "",
  periodicity: "",
  classesPerWeek: 1,
  price: "",
};

function PlansList() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  async function fetchPlans() {
    try {
      setLoading(true);
      const data = await getPlans();
      setPlans(data);
      setErro("");
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
      setErro("Não foi possível carregar os planos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "classesPerWeek" ? Number(value) : value,
    }));
  }

  function resetForm() {
    setFormData(initialFormData);
    setEditingPlanId(null);
  }

  function handleEdit(plan) {
    setEditingPlanId(plan.id);
    setFormData({
      name: plan.name || "",
      periodicity: plan.periodicity || "",
      classesPerWeek: plan.classesPerWeek || 1,
      price: plan.price ?? "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErro("");

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
      };

      if (editingPlanId) {
        await updatePlan(editingPlanId, payload);
      } else {
        await createPlan(payload);
      }

      resetForm();
      await fetchPlans();
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
      setErro(
        error.response?.data?.title ||
          error.response?.data ||
          "Não foi possível salvar o plano."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id) {
    const confirmar = window.confirm("Deseja desativar este plano?");

    if (!confirmar) return;

    try {
      await deactivatePlan(id);

      if (editingPlanId === id) {
        resetForm();
      }

      await fetchPlans();
    } catch (error) {
      console.error("Erro ao desativar plano:", error);
      setErro("Não foi possível desativar o plano.");
    }
  }

  async function handleActivate(id) {
    const confirmar = window.confirm("Deseja reativar este plano?");

    if (!confirmar) return;

    try {
      await activatePlan(id);
      await fetchPlans();
    } catch (error) {
      console.error("Erro ao reativar plano:", error);
      setErro("Não foi possível reativar o plano.");
    }
  }

  function formatCurrency(value) {
    return typeof value === "number"
      ? value.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      : Number(value).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Planos
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Cadastre e visualize os planos disponíveis da clínica.
          </p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>
              {editingPlanId ? "Editar plano" : "Cadastrar plano"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Periodicidade</label>
                  <Input
                    type="text"
                    name="periodicity"
                    value={formData.periodicity}
                    onChange={handleChange}
                    placeholder="Ex: Mensal"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Aulas por semana
                  </label>
                  <Input
                    type="number"
                    name="classesPerWeek"
                    value={formData.classesPerWeek}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Preço</label>
                  <Input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving
                    ? "Salvando..."
                    : editingPlanId
                    ? "Atualizar plano"
                    : "Cadastrar plano"}
                </Button>

                {editingPlanId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={resetForm}
                  >
                    Cancelar edição
                  </Button>
                )}
              </div>
            </form>
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
              <p>Carregando planos...</p>
            </CardContent>
          </Card>
        )}

        {!loading && !erro && plans.length === 0 && (
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <p>Nenhum plano encontrado.</p>
            </CardContent>
          </Card>
        )}

        {!loading && !erro && plans.length > 0 && (
          <>
            <div className="space-y-4 md:hidden">
              {plans.map((plan) => (
                <Card key={plan.id} className="rounded-2xl">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {plan.id}
                        </p>
                      </div>

                      {plan.isActive ? (
                        <Badge>Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Periodicidade:</span>{" "}
                        {plan.periodicity}
                      </p>
                      <p>
                        <span className="font-medium">Aulas por semana:</span>{" "}
                        {plan.classesPerWeek}
                      </p>
                      <p>
                        <span className="font-medium">Preço:</span>{" "}
                        {formatCurrency(plan.price)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleEdit(plan)}
                      >
                        Editar
                      </Button>

                      {plan.isActive ? (
                        <Button
                          type="button"
                          variant="destructive"
                          className="w-full"
                          onClick={() => handleDeactivate(plan.id)}
                        >
                          Desativar
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-primary text-primary hover:bg-primary/10"
                          onClick={() => handleActivate(plan.id)}
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
                <CardTitle>Lista de planos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Periodicidade</TableHead>
                        <TableHead>Aulas por semana</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {plans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell>{plan.id}</TableCell>

                          <TableCell className="font-medium">
                            {plan.name}
                          </TableCell>

                          <TableCell>{plan.periodicity}</TableCell>

                          <TableCell>{plan.classesPerWeek}</TableCell>

                          <TableCell>{formatCurrency(plan.price)}</TableCell>

                          <TableCell>
                            {plan.isActive ? (
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
                                onClick={() => handleEdit(plan)}
                              >
                                Editar
                              </Button>

                              {plan.isActive ? (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => handleDeactivate(plan.id)}
                                >
                                  Desativar
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-primary text-primary hover:bg-primary/10"
                                  onClick={() => handleActivate(plan.id)}
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

export default PlansList;