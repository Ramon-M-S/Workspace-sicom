"use client";

import { useState } from "react";
import {
  differenceInCalendarDays,
  eachMonthOfInterval,
  format,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronRight } from "lucide-react";

type Etapa = {
  id: string;
  titulo: string;
  inicio: Date | string;
  fim: Date | string;
  status: string;
};

type Fase = {
  id: string;
  nome: string;
  etapas: Etapa[];
};

type Props = {
  fases: Fase[];
  dataInicio: Date | string;
  dataFim: Date | string;
  totalDias: number;
};

const LARGURA_COLUNA_FASE = 256;
const LARGURA_MINIMA_TIMELINE = 720;

function dataCalendario(data: Date | string) {
  const valor = data instanceof Date ? data : new Date(data);
  return new Date(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate());
}

function corStatus(status: string, fim: Date, hoje: Date) {
  if (status === "concluida") return "bg-green-600";
  if (status === "em_andamento") return "bg-blue-600";
  if (fim < hoje) return "bg-red-600";
  return "bg-gray-400";
}

function intervaloFase(fase: Fase) {
  const datas = fase.etapas.flatMap((etapa) => [
    dataCalendario(etapa.inicio),
    dataCalendario(etapa.fim),
  ]);
  if (datas.length === 0) return null;
  return {
    inicio: new Date(Math.min(...datas.map((data) => data.getTime()))),
    fim: new Date(Math.max(...datas.map((data) => data.getTime()))),
  };
}

export function GanttInterativo({ fases, dataInicio, dataFim, totalDias }: Props) {
  const [fasesExpandidas, setFasesExpandidas] = useState<Set<string>>(
    () => new Set(fases[0] ? [fases[0].id] : []),
  );
  const inicio = dataCalendario(dataInicio);
  const fim = dataCalendario(dataFim);
  const hoje = startOfDay(new Date());
  const dias = Math.max(totalDias, 1);
  const larguraTimeline = Math.max(dias * 32, LARGURA_MINIMA_TIMELINE);
  const larguraDia = larguraTimeline / dias;
  const larguraGrafico = LARGURA_COLUNA_FASE + larguraTimeline;
  const offsetHoje = differenceInCalendarDays(hoje, inicio);
  const posicaoHoje =
    offsetHoje >= 0 && offsetHoje < dias ? offsetHoje * larguraDia : null;
  const meses = eachMonthOfInterval({
    start: startOfMonth(inicio),
    end: startOfMonth(fim),
  });

  function posicaoEtapa(etapa: Pick<Etapa, "inicio" | "fim">) {
    const inicioEtapa = dataCalendario(etapa.inicio);
    const fimEtapa = dataCalendario(etapa.fim);
    const offset = differenceInCalendarDays(inicioEtapa, inicio);
    const duracao = differenceInCalendarDays(fimEtapa, inicioEtapa) + 1;
    return { left: offset * larguraDia, width: Math.max(duracao * larguraDia, 8) };
  }

  function alternarFase(id: string) {
    setFasesExpandidas((atuais) => {
      const proximas = new Set(atuais);
      if (proximas.has(id)) proximas.delete(id);
      else proximas.add(id);
      return proximas;
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <div className="relative" style={{ width: larguraGrafico, minWidth: "100%" }}>
        <div className="grid h-11 border-b" style={{ gridTemplateColumns: `${LARGURA_COLUNA_FASE}px ${larguraTimeline}px` }}>
          <div className="sticky left-0 z-20 flex items-center border-r bg-background px-4 text-xs font-semibold text-muted-foreground">
            Fase / etapa
          </div>
          <div className="flex bg-background text-xs font-medium text-muted-foreground">
            {meses.map((mes) => {
              const proximoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 1);
              const inicioMes = mes < inicio ? inicio : mes;
              const fimMes = proximoMes > fim ? new Date(fim.getFullYear(), fim.getMonth(), fim.getDate() + 1) : proximoMes;
              const quantidadeDias = Math.max(differenceInCalendarDays(fimMes, inicioMes), 0);
              const largura = Math.max(quantidadeDias * larguraDia, 1);

              return (
                <div
                  key={mes.toISOString()}
                  className="flex shrink-0 items-center border-l px-2 first:border-l-0"
                  style={{ width: largura }}
                >
                  {format(mes, "MMM/yy", { locale: ptBR }).replace(".", "")}
                </div>
              );
            })}
          </div>
        </div>

        {posicaoHoje !== null && (
          <div
            className="pointer-events-none absolute bottom-0 top-11 z-10 w-0.5 bg-red-500"
            style={{ left: LARGURA_COLUNA_FASE + posicaoHoje }}
            title="Hoje"
            aria-label="Hoje"
          />
        )}

        {fases.map((fase) => {
          const expandida = fasesExpandidas.has(fase.id);
          const periodo = intervaloFase(fase);
          const posicao = periodo ? posicaoEtapa(periodo) : null;

          return (
            <div key={fase.id}>
              <div
                className="grid h-12 border-b bg-muted/60"
                style={{ gridTemplateColumns: `${LARGURA_COLUNA_FASE}px ${larguraTimeline}px` }}
              >
                <button
                  type="button"
                  onClick={() => alternarFase(fase.id)}
                  aria-expanded={expandida}
                  className="sticky left-0 z-[5] flex min-w-0 items-center gap-2 border-r bg-muted/60 px-3 text-left text-sm font-semibold hover:bg-muted"
                >
                  {expandida ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{fase.nome}</span>
                </button>
                <div className="relative">
                  {periodo && posicao && (
                    <div
                      className="absolute top-2.5 h-7 rounded bg-primary/70"
                      style={{ left: posicao.left, width: posicao.width }}
                      title={`${fase.nome}: ${format(periodo.inicio, "dd/MM/yyyy")} – ${format(periodo.fim, "dd/MM/yyyy")}`}
                      aria-label={`Duração da fase ${fase.nome}`}
                    />
                  )}
                </div>
              </div>

              {expandida && fase.etapas.map((etapa) => {
                const posicaoEtapaAtual = posicaoEtapa(etapa);
                const fimEtapa = dataCalendario(etapa.fim);
                const cor = corStatus(etapa.status, fimEtapa, hoje);

                return (
                  <div
                    key={etapa.id}
                    className="grid h-10 border-b last:border-b-0"
                    style={{ gridTemplateColumns: `${LARGURA_COLUNA_FASE}px ${larguraTimeline}px` }}
                  >
                    <div className="sticky left-0 z-[5] flex min-w-0 items-center border-r bg-background px-4 pl-9 text-sm">
                      <span className="truncate" title={etapa.titulo}>{etapa.titulo}</span>
                    </div>
                    <div className="relative bg-muted/10">
                      <div
                        className={`absolute top-2 h-6 rounded ${cor}`}
                        style={{ left: posicaoEtapaAtual.left, width: posicaoEtapaAtual.width }}
                        title={`${etapa.titulo}: ${format(dataCalendario(etapa.inicio), "dd/MM/yyyy")} – ${format(fimEtapa, "dd/MM/yyyy")}`}
                        aria-label={`Etapa ${etapa.titulo}, status ${etapa.status}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
