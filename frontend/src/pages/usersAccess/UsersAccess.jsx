import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import { getUsers, createUser } from "../../services/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const initialFormData = {
  name: "",
  email: "",
  password: "",
};

function UsersAccess() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function fetchUsers() {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      setErro("");
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      setErro("Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setErro("");
      setMensagem("");

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: "admin",
      };

      await createUser(payload);

      setMensagem("Administrador criado com sucesso.");
      setFormData(initialFormData);
      await fetchUsers();
    } catch (error) {
      console.error("Erro ao criar usuário:", error);

      const mensagemErro =
        error?.response?.data ||
        error?.response?.data?.message ||
        "Não foi possível criar o usuário.";

      setErro(
        typeof mensagemErro === "string"
          ? mensagemErro
          : "Não foi possível criar o usuário."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Acessos do Sistema
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Gerencie os usuários administradores da clínica.
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

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Novo administrador</CardTitle>
              <CardDescription>
                Crie acessos administrativos para o sistema.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Digite o nome"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Digite o e-mail"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Senha</label>
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Digite a senha"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Criando..." : "Criar administrador"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Administradores</CardTitle>
              <CardDescription>
                Lista de usuários com acesso ao sistema.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum usuário cadastrado.
                </p>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="space-y-1 rounded-xl border p-4"
                    >
                      <p className="font-medium">{user.name}</p>
                      <p className="break-all text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Perfil: {user.role}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ativo: {user.isActive ? "Sim" : "Não"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default UsersAccess;