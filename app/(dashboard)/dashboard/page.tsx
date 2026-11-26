import Link from "next/link";
import { differenceInDays, format, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buscarDadosDashboard } from "@/lib/queries/dashboard";
import { BotaoExportarPdf } from "@/components/dashboard/botao-exportar-pdf";
import { GraficoProgresso } from "@/components/dashboard/grafico-progresso";
import { GraficoFases } from "@/components/dashboard/grafico-fases";

function formatarData(data: string) {
  return format(new Date(`${data.slice(0, 10)}T12:00:00`), "dd/MM/yyyy", { locale: ptBR });
}

function textoDias(dias: number, fim?: string) {
  if (dias < 0) return `Pendente desde ${fim ? formatarData(fim) : "a data prevista"}`;
  if (dias === 0) return "Vence hoje";
  return `Faltam ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

export default async function DashboardPage() {
  const dados = await buscarDadosDashboard();
  const diasAteDefesa = dados.configuracao?.dataDefesa
    ? differenceInDays(
        new Date(`${dados.configuracao.dataDefesa}T00:00:00`),
        startOfToday(),
      )
    : null;
  const cardContagemRegressiva =
    diasAteDefesa !== null && dados.configuracao?.dataDefesa ? (
      <Card className="flex h-[120px] flex-col border-accent/50">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Defesa
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col items-center justify-center p-2 pt-0 text-center">
          <p className="text-xl font-semibold">
            {diasAteDefesa === 0
              ? "A defesa é hoje!"
              : diasAteDefesa < 0
                ? "Defesa realizada"
                : `Faltam ${diasAteDefesa} ${diasAteDefesa === 1 ? "dia" : "dias"} para a defesa`}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatarData(dados.configuracao.dataDefesa)}
          </p>
        </CardContent>
      </Card>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            {dados.configuracao?.nomeProjeto || "Meu TCC"}
          </h1>
          <p className="text-muted-foreground">Acompanhe o progresso do seu TCC.</p>
          {dados.configuracao?.dataInicio && (
            <p className="mt-1 text-xs text-muted-foreground">
              Iniciado em {formatarData(dados.configuracao.dataInicio)}
            </p>
          )}
        </div>
        <BotaoExportarPdf etapas={dados.etapas} fases={dados.fases} />
      </div>

      {dados.totais.etapas === 0 ? (
        <>
          {cardContagemRegressiva}
          <Card>
            <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
              <p className="max-w-xl text-muted-foreground">
                Seu caminho está pronto para começar. Que tal usar o Importador de
                Cronograma ou criar a sua primeira etapa?
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/etapas">Criar primeira etapa</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/importar">Importar Cronograma</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
      <>
      <section
        aria-label="Resumo do projeto"
        className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${dados.configuracao?.dataDefesa ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}
      >
        <Card className="flex h-[120px] flex-col">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm font-normal text-muted-foreground">Progresso geral</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 items-center justify-center p-1">
            <GraficoProgresso
              concluidas={dados.totais.concluidas}
              emAndamento={dados.totais.emAndamento}
              pendentes={dados.totais.pendentes}
              percentual={dados.totais.progressoGeral}
            />
          </CardContent>
        </Card>

        {cardContagemRegressiva}

        <Card className="flex h-[120px] flex-col">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm font-normal text-muted-foreground">Etapas concluídas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center p-2 pt-0">
            <p className="text-3xl font-bold">{dados.totais.concluidas}</p>
            <p className="text-xs text-muted-foreground">de {dados.totais.etapas}</p>
          </CardContent>
        </Card>

        <Card className="flex h-[120px] flex-col">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm font-normal text-muted-foreground">Em andamento</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center p-2 pt-0">
            <p className="text-3xl font-bold">{dados.totais.emAndamento}</p>
            <p className="text-xs text-muted-foreground">etapas</p>
          </CardContent>
        </Card>

        <Card className="flex h-[120px] flex-col">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm font-normal text-muted-foreground">Pendentes após a data prevista</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center p-2 pt-0">
            <p
              className={`text-3xl font-bold ${dados.totais.atrasadas > 0 ? "text-primary" : "text-muted-foreground"}`}
            >
              {dados.totais.atrasadas}
            </p>
            <p className="text-xs text-muted-foreground">com prazo vencido</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-l-4 border-l-accent">
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
                    <span>{textoDias(dados.proximaEtapa.diasRestantes, dados.proximaEtapa.fim)}</span>
                    <span aria-hidden="true">·</span>
                    <span>Até {formatarData(dados.proximaEtapa.fim)}</span>
                  </div>
                </div>
                <Button
                  asChild
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Link href={`/etapas/${encodeURIComponent(dados.proximaEtapa.id)}`}>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Progresso por fase</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoFases fases={dados.fases} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
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
                        href={`/etapas/${encodeURIComponent(etapa.etapaId)}`}
                        className="font-medium hover:underline"
                      >
                        {etapa.titulo}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {textoDias(etapa.diasRestantes, etapa.fim)} · até {formatarData(etapa.fim)}
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
      </>
      )}
    </div>
  );
}
