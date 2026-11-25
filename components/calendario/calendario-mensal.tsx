"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

type EtapaCalendario = {
  id: string;
  titulo: string;
  inicio: Date;
  fim: Date;
  status: string;
  fase: { nome: string };
};

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function dataCalendario(data: Date | string) {
  const dataUtc = new Date(data);
  return new Date(dataUtc.getUTCFullYear(), dataUtc.getUTCMonth(), dataUtc.getUTCDate());
}

export function CalendarioMensal({ etapas }: { etapas: EtapaCalendario[] }) {
  const [dataAtual, setDataAtual] = useState(() => new Date());
  const inicioMes = startOfMonth(dataAtual);
  const fimMes = endOfMonth(dataAtual);
  const diasDoMes = eachDayOfInterval({ start: inicioMes, end: fimMes });
  const inicioGrid = startOfWeek(inicioMes, { weekStartsOn: 0 });
  const fimGrid = endOfWeek(fimMes, { weekStartsOn: 0 });
  const diasGrid = eachDayOfInterval({ start: inicioGrid, end: fimGrid });
  const numeroDeSemanas = Math.ceil(diasGrid.length / 7);
  const etapasPorDia = useMemo(() => {
    return etapas.map((etapa) => ({
      ...etapa,
      inicioCalendario: dataCalendario(etapa.inicio),
      fimCalendario: dataCalendario(etapa.fim),
    }));
  }, [etapas]);

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3" aria-label="Calendário mensal de prazos">
      <header className="flex shrink-0 items-center justify-between gap-4">
        <h2 className="text-xl font-semibold capitalize">
          {format(dataAtual, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setDataAtual((data) => subMonths(data, 1))}>
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Mês anterior
          </Button>
          <Button type="button" variant="outline" onClick={() => setDataAtual((data) => addMonths(data, 1))}>
            Próximo mês
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-7 rounded-t-lg border border-b-0 bg-muted/40">
        {diasSemana.map((dia) => (
          <div key={dia} className="p-2 text-center text-xs font-medium text-muted-foreground">
            {dia}
          </div>
        ))}
      </div>
      <div
        className="grid min-h-0 flex-1 grid-cols-7 gap-px overflow-hidden rounded-b-lg border border-border bg-border"
        style={{ gridTemplateRows: `repeat(${numeroDeSemanas}, minmax(0, 1fr))` }}
      >
        {diasGrid.map((dia) => {
          const eventos = etapasPorDia.flatMap((etapa) => {
            const ocorrencias = [];
            if (isSameDay(etapa.inicioCalendario, dia)) ocorrencias.push({ etapa, tipo: "Início" });
            if (isSameDay(etapa.fimCalendario, dia)) ocorrencias.push({ etapa, tipo: "Prazo" });
            return ocorrencias;
          });

          return (
            <div
              key={dia.toISOString()}
              className={cn(
                "flex min-h-0 flex-col overflow-hidden bg-background p-2",
                !isSameMonth(dia, dataAtual) && "bg-muted/20",
              )}
              aria-label={format(dia, "d 'de' MMMM", { locale: ptBR })}
            >
              <span
                className={cn(
                  "inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1 text-xs",
                  !isSameMonth(dia, dataAtual) && "text-muted-foreground",
                  isToday(dia) && "bg-primary text-primary-foreground",
                )}
              >
                {format(dia, "d")}
              </span>
              <div className="mt-1 min-h-0 flex-1 space-y-1 overflow-y-auto scrollbar-thin">
                {eventos.map(({ etapa, tipo }, index) => (
                  <div
                    key={`${etapa.id}-${tipo}-${index}`}
                    className="truncate rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
                    title={`${tipo}: ${etapa.titulo} · ${etapa.fase.nome}`}
                  >
                    <span className="font-medium">{tipo}:</span> {etapa.titulo}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <span className="sr-only">Este mês tem {diasDoMes.length} dias.</span>
    </section>
  );
}
