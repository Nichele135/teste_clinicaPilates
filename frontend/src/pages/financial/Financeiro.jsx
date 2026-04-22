import { useEffect, useMemo, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import {
  getMonthlyFinancialStatus,
  markPaymentAsPaid,
  undoPayment,
} from "../../services/financialService";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Banknote, CheckCircle2, Search, Wallet, XCircle } from "lucide-react";

function Financeiro() {
  const today = new Date();

  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [search, setSearch] = useState("");

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [processingId, setProcessingId] = useState(null);

  async function fetchFinancialData() {
    try {
      setLoading(true);
      setErro("");

      const data = await getMonthlyFinancialStatus(Number(month), Number(year));
      setPayments(data);
    } catch (error) {
      console.error("Erro ao carregar financeiro:", error);
      setErro("Não foi possível carregar os dados financeiros.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFinancialData();
  }, [month, year]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) =>
      payment.studentName.toLowerCase().includes(search.toLowerCase())
    );
  }, [payments, search]);

  const pendingPayments = useMemo(() => {
    return filteredPayments.filter((payment) => payment.status === "Pending");
  }, [filteredPayments]);

  const paidPayments = useMemo(() => {
    return filteredPayments.filter((payment) => payment.status === "Paid");
  }, [filteredPayments]);

  const totalToReceive = pendingPayments.reduce(
    (sum, payment) => sum + Number(payment.planPrice || 0),
    0
  );

  const totalReceived = paidPayments.reduce(
    (sum, payment) => sum + Number(payment.planPrice || 0),
    0
  );

  async function handleMarkAsPaid(paymentId) {
    try {
      setProcessingId(paymentId);
      await markPaymentAsPaid(paymentId, "Pagamento confirmado manualmente.");
      await fetchFinancialData();
    } catch (error) {
      console.error("Erro ao marcar pagamento como pago:", error);
      alert("Não foi possível marcar o pagamento como pago.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleUndoPayment(paymentId) {
    try {
      setProcessingId(paymentId);
      await undoPayment(paymentId);
      await fetchFinancialData();
    } catch (error) {
      console.error("Erro ao desfazer pagamento:", error);
      alert("Não foi possível desfazer o pagamento.");
    } finally {
      setProcessingId(null);
    }
  }

  function formatCurrency(value) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatReference(monthValue, yearValue) {
    return `${String(monthValue).padStart(2, "0")}/${yearValue}`;
  }

  function formatDate(dateString) {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleString("pt-BR");
  }

  const months = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Financeiro
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Controle mensal de pagamentos dos alunos com plano ativo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl md:col-span-1">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>
                Pesquise alunos e selecione o mês de referência.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar aluno</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Digite o nome do aluno"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mês</label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ano</label>
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    min="2024"
                    max="2100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:col-span-2 md:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardDescription>Pendentes</CardDescription>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <XCircle className="h-5 w-5 text-red-500" />
                  {pendingPayments.length}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardDescription>Pagos</CardDescription>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  {paidPayments.length}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardDescription>A receber</CardDescription>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <Wallet className="h-5 w-5 text-blue-600" />
                  <span className="break-words">{formatCurrency(totalToReceive)}</span>
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardDescription>Recebido</CardDescription>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <Banknote className="h-5 w-5 text-emerald-600" />
                  <span className="break-words">{formatCurrency(totalReceived)}</span>
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>

        {erro && (
          <Card className="rounded-2xl border-red-200">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-red-600">{erro}</p>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Pagamentos pendentes</CardTitle>
            <CardDescription>
              Alunos que ainda não tiveram o pagamento confirmado neste mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando dados...</p>
            ) : pendingPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum pagamento pendente encontrado.
              </p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {pendingPayments.map((payment) => (
                    <div
                      key={payment.paymentId}
                      className="rounded-xl border p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{payment.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.studentPhone}
                          </p>
                        </div>
                        <Badge variant="destructive">Pendente</Badge>
                      </div>

                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Plano:</span>{" "}
                          {payment.planName}
                        </p>
                        <p>
                          <span className="font-medium">Referência:</span>{" "}
                          {formatReference(
                            payment.referenceMonth,
                            payment.referenceYear
                          )}
                        </p>
                        <p>
                          <span className="font-medium">Valor:</span>{" "}
                          {formatCurrency(payment.planPrice)}
                        </p>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => handleMarkAsPaid(payment.paymentId)}
                        disabled={processingId === payment.paymentId}
                      >
                        {processingId === payment.paymentId
                          ? "Processando..."
                          : "Marcar como pago"}
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Referência</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.map((payment) => (
                        <TableRow key={payment.paymentId}>
                          <TableCell className="font-medium">
                            {payment.studentName}
                          </TableCell>
                          <TableCell>{payment.studentPhone}</TableCell>
                          <TableCell>{payment.planName}</TableCell>
                          <TableCell>
                            {formatReference(
                              payment.referenceMonth,
                              payment.referenceYear
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(payment.planPrice)}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">Pendente</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => handleMarkAsPaid(payment.paymentId)}
                              disabled={processingId === payment.paymentId}
                            >
                              {processingId === payment.paymentId
                                ? "Processando..."
                                : "Marcar como pago"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Pagamentos confirmados</CardTitle>
            <CardDescription>
              Alunos com pagamento já marcado como recebido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando dados...</p>
            ) : paidPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum pagamento confirmado encontrado.
              </p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {paidPayments.map((payment) => (
                    <div
                      key={payment.paymentId}
                      className="rounded-xl border p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{payment.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.studentPhone}
                          </p>
                        </div>
                        <Badge>Paga</Badge>
                      </div>

                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Plano:</span>{" "}
                          {payment.planName}
                        </p>
                        <p>
                          <span className="font-medium">Referência:</span>{" "}
                          {formatReference(
                            payment.referenceMonth,
                            payment.referenceYear
                          )}
                        </p>
                        <p>
                          <span className="font-medium">Valor:</span>{" "}
                          {formatCurrency(payment.planPrice)}
                        </p>
                        <p>
                          <span className="font-medium">Pago em:</span>{" "}
                          {formatDate(payment.paidAt)}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleUndoPayment(payment.paymentId)}
                        disabled={processingId === payment.paymentId}
                      >
                        {processingId === payment.paymentId
                          ? "Processando..."
                          : "Desfazer"}
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Referência</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Pago em</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidPayments.map((payment) => (
                        <TableRow key={payment.paymentId}>
                          <TableCell className="font-medium">
                            {payment.studentName}
                          </TableCell>
                          <TableCell>{payment.studentPhone}</TableCell>
                          <TableCell>{payment.planName}</TableCell>
                          <TableCell>
                            {formatReference(
                              payment.referenceMonth,
                              payment.referenceYear
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(payment.planPrice)}</TableCell>
                          <TableCell>{formatDate(payment.paidAt)}</TableCell>
                          <TableCell>
                            <Badge>Paga</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              onClick={() => handleUndoPayment(payment.paymentId)}
                              disabled={processingId === payment.paymentId}
                            >
                              {processingId === payment.paymentId
                                ? "Processando..."
                                : "Desfazer"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default Financeiro;