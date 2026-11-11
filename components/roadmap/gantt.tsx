"use client";

import {
  addMonths,
  differenceInCalendarDays,
  eachMonthOfInterval,
  format,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";

type EtapaRoadmap = {
  id: string;
  titulo: string;
  inicio: Date | string;
  fim: Date | string;
  status: string;
  progresso: number;
  fase: { nome: string; ordem: number };
};

type Props = {
  etapas: EtapaRoadmap[];
  dataInicio: Date | string;
  dataFim: Date | string;
  totalDias: number;
};

const COLUNA_ETAPA_PX = 260;

function dataCalendario(data: Date | string) {
  const valor = data instanceof Date ? data : new Date(data);
  return new Date(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate());
}

function formatarPeriodo(inicio: Date | string, fim: Date | string) {
  return `${format(dataCalendario(inicio), "dd/MM/yyyy")} – ${format(dataCalendario(fim), "dd/MM/yyyy")}`;
}

function labelStatus(status: string) {
  if (status === "em_andamento") return "Em andamento";
  if (status === "concluida") return "Concluída";
  if (status === "atrasada") return "Atrasada";
  return "Pendente";
}

function corStatus(status: string) {
  if (status === "em_andamento") return "bg-blue-600";
  if (status === "concluida") return "bg-green-600";
  if (status === "atrasada") return "bg-red-600";
  return "bg-gray-400";
}

export function Gantt({ etapas, dataInicio, dataFim, totalDias }: Props) {
  const inicioCalendario = dataCalendario(dataInicio);
  const fimCalendario = dataCalendario(dataFim);
  const hoje = startOfDay(new Date());
  const offsetHoje = differenceInCalendarDays(hoje, inicioCalendario);
  const posicaoHoje =
    offsetHoje < 0 || offsetHoje >= totalDias
      ? null
      : (offsetHoje / totalDias) * 100;

  const meses = eachMonthOfInterval({
    start: startOfMonth(inicioCalendario),
    end: startOfMonth(fimCalendario),
  });
  const mesesVisiveis =
    meses.length <= 6 ? meses : [...meses.slice(0, 5), meses[meses.length - 1]];
  const segmentosMeses = mesesVisiveis.map((mes, index) => {
    const proximoMes = mesesVisiveis[index + 1] ?? addMonths(mes, 1);
    const inicioSegmento = index === 0 ? inicioCalendario : mes;
    const fimSegmento =
      index === mesesVisiveis.length - 1
        ? new Date(fimCalendario.getFullYear(), fimCalendario.getMonth(), fimCalendario.getDate() + 1)
        : proximoMes;

    return {
      mes,
      dias: Math.max(differenceInCalendarDays(fimSegmento, inicioSegmento), 0),
    };
  });
  const totalDiasSegmentos = segmentosMeses.reduce((soma, segmento) => soma + segmento.dias, 0);

  const fases = etapas.reduce<Array<{ nome: string; ordem: number; etapas: EtapaRoadmap[] }>>(
    (grupos, etapa) => {
      let fase = grupos.find(
        (grupo) => grupo.nome === etapa.fase.nome && grupo.ordem === etapa.fase.ordem,
      );
      if (!fase) {
        fase = { nome: etapa.fase.nome, ordem: etapa.fase.ordem, etapas: [] };
        grupos.push(fase);
      }
      fase.etapas.push(etapa);
      return grupos;
    },
    [],
  ).sort((a, b) => a.ordem - b.ordem);

  function statusEtapa(etapa: EtapaRoadmap) {
    if (etapa.status === "concluida" || etapa.status === "em_andamento") {
      return etapa.status;
    }
    return dataCalendario(etapa.fim) < hoje ? "atrasada" : "pendente";
  }

  function calcularPosicao(etapa: EtapaRoadmap) {
    const inicioEtapa = dataCalendario(etapa.inicio);
    const fimEtapa = dataCalendario(etapa.fim);
    const inicioOffset = differenceInCalendarDays(inicioEtapa, inicioCalendario);
    const duracao = differenceInCalendarDays(fimEtapa, inicioEtapa) + 1;

    return {
      left: (inicioOffset / totalDias) * 100,
      width: Math.max((duracao / totalDias) * 100, 0.5),
    };
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap gap-4 text-xs">
        {["pendente", "em_andamento", "concluida", "atrasada"].map((status) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded ${corStatus(status)}`} />
            <span>{labelStatus(status)}</span>
          </div>
        ))}
      </div>

      <div className="min-h-0 w-full flex-1 overflow-auto rounded-md border">
        <div className="relative grid min-h-full min-w-[980px] grid-cols-[260px_minmax(720px,1fr)]">
          <div className="flex min-h-11 items-center border-b bg-background px-4 text-xs font-medium text-muted-foreground">
            Etapa
          </div>
          <div className="flex min-h-11 border-b bg-background text-xs font-medium text-muted-foreground">
            {segmentosMeses.map((segmento, index) => {
              const largura = totalDiasSegmentos
                ? (segmento.dias / totalDiasSegmentos) * 100
                : 0;

              return (
                <div
                  key={segmento.mes.toISOString()}
                  className="flex shrink-0 items-center border-l px-2 first:border-l-0"
                  style={{ width: `${largura}%` }}
                >
                  {format(segmento.mes, "MMM/yy", { locale: ptBR }).replace(".", "")}
                  {meses.length > 6 && index === 4 ? " …" : ""}
                </div>
              );
            })}
          </div>

          <div
            className="pointer-events-none absolute bottom-0 top-11 z-10"
            style={{ left: `${COLUNA_ETAPA_PX}px`, right: 0 }}
            aria-hidden="true"
          >
            {posicaoHoje !== null && (
              <div
                className="absolute bottom-0 top-0 w-0.5 bg-red-500"
                style={{ left: `${posicaoHoje}%` }}
                title="Hoje"
              />
            )}
          </div>

          {fases.map((fase) => (
            <div
              key={`${fase.ordem}-${fase.nome}`}
              className="col-span-2 border-b bg-muted/50 px-4 py-2 text-sm font-semibold"
            >
              {fase.nome}
            </div>
          ))}

          {fases.flatMap((fase) =>
            fase.etapas.map((etapa) => {
              const { left, width } = calcularPosicao(etapa);
              const status = statusEtapa(etapa);
              const tooltip = `${etapa.titulo}\n${formatarPeriodo(etapa.inicio, etapa.fim)}\nStatus: ${labelStatus(status)} · ${etapa.progresso}%`;

              return (
                <div key={etapa.id} className="contents">
                  <div
                    className="flex min-w-0 items-center border-b bg-background px-4 py-2"
                    title={etapa.titulo}
                  >
                    <span className="truncate text-sm">{etapa.titulo}</span>
                  </div>
                  <div className="relative h-11 min-w-0 border-b bg-muted/10">
                    <div
                      className={`absolute top-2 flex h-7 items-center overflow-hidden rounded ${corStatus(status)}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={tooltip}
                      aria-label={tooltip}
                    >
                      <span className="truncate px-2 text-xs font-medium text-white">
                        {etapa.titulo}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
