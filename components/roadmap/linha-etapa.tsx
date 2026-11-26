"use client";

import Link from "next/link";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type EtapaLinha = {
  id: string;
  titulo: string;
  inicio: Date | string;
  fim: Date | string;
  status: string;
};

function dataCalendario(data: Date | string) {
  const valor = data instanceof Date ? data : new Date(data);
  return new Date(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate());
}

function labelStatus(status: string) {
  if (status === "em_andamento") return "Em andamento";
  if (status === "concluida") return "Concluída";
  if (status === "atrasada") return "Pendente";
  return "Pendente";
}

export function LinhaEtapa({ etapa }: { etapa: EtapaLinha }) {
  const inicio = dataCalendario(etapa.inicio);
  const fim = dataCalendario(etapa.fim);
  const diasRestantes = differenceInCalendarDays(fim, startOfDay(new Date()));
  const atrasada = diasRestantes < 0 && etapa.status !== "concluida";
  const statusVisual = atrasada ? "atrasada" : etapa.status;

  const corUrgencia =
    etapa.status === "concluida"
      ? "bg-muted"
      : diasRestantes < 0
        ? "bg-brass/15"
        : diasRestantes <= 7
          ? "bg-brass/15"
          : "bg-muted";
  const corBadge =
    statusVisual === "atrasada"
      ? "bg-brass/15 text-foreground hover:bg-brass/15"
      : statusVisual === "em_andamento"
        ? "bg-primary/10 text-primary hover:bg-primary/10"
        : statusVisual === "concluida"
          ? "bg-primary/10 text-primary hover:bg-primary/10"
          : "bg-muted text-muted-foreground";
  const varianteBadge =
    statusVisual === "concluida" ? "secondary" : statusVisual === "em_andamento" ? "default" : "outline";

  return (
    <Link
      href={`/etapas/${encodeURIComponent(etapa.id)}`}
      className="flex items-center gap-4 rounded-md border p-3 transition-colors hover:bg-muted/50"
    >
      <div className="shrink-0">
        <div
          className={`h-3 w-3 rounded-full ${corUrgencia}`}
          aria-label={atrasada ? `Pendente desde ${format(fim, "dd/MM")}` : diasRestantes <= 7 ? "Prazo próximo" : "Prazo futuro"}
          title={atrasada ? `Pendente desde ${format(fim, "dd/MM")}` : diasRestantes <= 7 ? "Prazo próximo" : "Prazo futuro"}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{etapa.titulo}</p>
        <p className="text-xs text-muted-foreground">
          {atrasada ? `Pendente desde ${format(fim, "dd/MM/yyyy")}` : `Vence em ${format(fim, "dd/MM/yyyy")} (${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"})`}
        </p>
      </div>

      <div className="hidden shrink-0 items-center gap-2 text-xs text-muted-foreground md:flex">
        <span>{format(inicio, "dd/MM")}</span>
        <ArrowRight className="h-3 w-3" />
        <span>{format(fim, "dd/MM")}</span>
      </div>

      <Badge variant={varianteBadge} className={`shrink-0 ${corBadge}`}>
        {labelStatus(statusVisual)}
      </Badge>
    </Link>
  );
}
