import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buscarDadosDashboard } from "@/lib/queries/dashboard";

function BarraProgresso({ percent }: { percent: number }) {
  const valor = Math.min(100, Math.max(0, percent));

  return (
    <div
      className="h-2 w-full rounded-full bg-muted"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={valor}
    >
      <div
        className="h-2 rounded-full bg-primary transition-all"
        style={{ width: `${valor}%` }}
      />
    </div>
  );
}

function formatarData(data: string) {
  return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
}

function textoDias(dias: number) {
  if (dias < 0) return `Atrasada há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"}`;
  if (dias === 0) return "Vence hoje";
  return `Faltam ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

export default async function DashboardPage() {
  const dados = await buscarDadosDashboard();

  if (dados.totais.etapas === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Nenhuma etapa cadastrada. Rode o seed do banco.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Acompanhe o progresso do TCC SICOM.</p>
      </div>

      <section
        aria-label="Resumo do projeto"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Progresso geral</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">{dados.totais.progressoGeral}%</p>
            <BarraProgresso percent={dados.totais.progressoGeral} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Etapas concluídas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {dados.totais.concluidas} <span className="text-lg font-normal text-muted-foreground">de {dados.totais.etapas}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Em andamento</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{dados.totais.emAndamento}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Atrasadas</CardTitle>
              <AlertTriangle
                className={`h-4 w-4 ${dados.totais.atrasadas > 0 ? "text-red-600" : "text-muted-foreground"}`}
              />
            </div>
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-semibold ${dados.totais.atrasadas > 0 ? "text-red-600" : "text-muted-foreground"}`}
            >
              {dados.totais.atrasadas}
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próxima etapa</CardTitle>
          </CardHeader>
          <CardContent>
            {dados.proximaEtapa ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <h2 className="font-medium">{dados.proximaEtapa.titulo}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>{dados.proximaEtapa.faseNome}</span>
                    <span aria-hidden="true">·</span>
                    <span>{textoDias(dados.proximaEtapa.diasRestantes)}</span>
                    <span aria-hidden="true">·</span>
                    <span>Até {formatarData(dados.proximaEtapa.fim)}</span>
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/etapas/${dados.proximaEtapa.id}`}>
                    Ver detalhes
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">Todas as etapas concluídas 🎉</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lembretes próximos (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {dados.lembretesProximos.length === 0 ? (
              <p className="text-muted-foreground">Nenhum lembrete nos próximos 7 dias.</p>
            ) : (
              <ul className="space-y-4">
                {dados.lembretesProximos.map((etapa) => (
                  <li
                    key={etapa.etapaId}
                    className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <Link
                        href={`/etapas/${etapa.etapaId}`}
                        className="font-medium hover:underline"
                      >
                        {etapa.titulo}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {textoDias(etapa.diasRestantes)} · até {formatarData(etapa.fim)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Hoje: {etapa.lembretesHoje}</Badge>
                      <Badge variant="outline">Próximos: {etapa.lembretesProximos}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progresso por fase</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-5">
            {dados.fases.map((fase) => (
              <li key={fase.id} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{fase.nome}</span>
                  <span className="text-muted-foreground">
                    {fase.etapasConcluidas}/{fase.totalEtapas} etapas · {fase.progressoMedio}%
                  </span>
                </div>
                <BarraProgresso percent={fase.progressoMedio} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
