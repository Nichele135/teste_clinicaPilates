import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  bootstrapAdminRequest,
  getBootstrapStatus,
  loginRequest,
} from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [adminExists, setAdminExists] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [bootstrapErro, setBootstrapErro] = useState("");
  const [bootstrapSaving, setBootstrapSaving] = useState(false);

  useEffect(() => {
    async function loadBootstrapStatus() {
      try {
        const data = await getBootstrapStatus();
        setAdminExists(data.adminExists);
      } catch (error) {
        console.error("Erro ao verificar status do bootstrap:", error);
        setErro("Não foi possível verificar o status do sistema.");
      } finally {
        setBootstrapLoading(false);
      }
    }

    loadBootstrapStatus();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const data = await loginRequest(email, password);

      const token = data.token;
      const user = data.user;

      login(token, user);

      navigate("/dashboard");
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setErro("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBootstrapSubmit(event) {
    event.preventDefault();
    setBootstrapErro("");
    setBootstrapSaving(true);

    try {
      await bootstrapAdminRequest({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      });

      setAdminExists(true);
      setEmail(adminEmail);
      setPassword(adminPassword);

      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
    } catch (error) {
      console.error("Erro ao criar primeiro admin:", error);

      const mensagem =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Não foi possível criar o primeiro administrador.";

      setBootstrapErro(mensagem);
    } finally {
      setBootstrapSaving(false);
    }
  }

  if (bootstrapLoading) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Carregando sistema...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <Card className="overflow-hidden p-0 shadow-lg">
          <CardContent className="grid p-0 md:grid-cols-2">
            {!adminExists ? (
              <form onSubmit={handleBootstrapSubmit} className="p-6 md:p-8">
                <FieldGroup className="gap-6">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Primeiro acesso</h1>
                    <p className="text-sm text-muted-foreground">
                      Cadastre o primeiro administrador da Clínica Pilates
                    </p>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="adminName">Nome</FieldLabel>
                    <Input
                      id="adminName"
                      type="text"
                      placeholder="Digite o nome do administrador"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="adminEmail">E-mail</FieldLabel>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="Digite o e-mail do administrador"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="adminPassword">Senha</FieldLabel>
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="Digite a senha"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                  </Field>

                  {bootstrapErro && (
                    <FieldDescription className="text-center text-sm text-red-500">
                      {bootstrapErro}
                    </FieldDescription>
                  )}

                  <Field>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={bootstrapSaving}
                    >
                      {bootstrapSaving
                        ? "Criando administrador..."
                        : "Criar primeiro administrador"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                <FieldGroup className="gap-6">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Clínica Pilates</h1>
                    <p className="text-sm text-muted-foreground">
                      Faça login para acessar o sistema
                    </p>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="email">E-mail</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="password">Senha</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Field>

                  {erro && (
                    <FieldDescription className="text-center text-sm text-red-500">
                      {erro}
                    </FieldDescription>
                  )}

                  <Field>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Entrando..." : "Entrar"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            )}

            <div className="relative hidden bg-muted md:block">
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="max-w-sm text-center">
                  <h2 className="text-2xl font-semibold text-foreground">
                    Bem-vindo ao sistema
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Gerencie alunos, planos, horários e aulas da clínica em um
                    só lugar.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login;