"use client";

import { format } from "date-fns";
import { MessageSquare, Paperclip, Pencil } from "lucide-react";
import type { LogAlteracao } from "@/lib/generated/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type HistoricoEtapaProps = {
  etapa: {
    logs: Array<Omit<LogAlteracao, "criadoEm"> & { criadoEm: string }>;
  };
};

function iconeDoLog(tipo: string) {
  if (tipo === "anotacao") return MessageSquare;
  if (tipo === "anexo") return Paperclip;
  return Pencil;
}

function textoDoLog(log: Pick<LogAlteracao, "tipo" | "valorAntigo" | "valorNovo">) {
  if (log.tipo === "status") {
    return `Status alterado de ${log.valorAntigo ?? "—"} para ${log.valorNovo ?? "—"}`;
  }
  if (log.tipo === "progresso") {
    return `Progresso alterado de ${log.valorAntigo ?? "—"}% para ${log.valorNovo ?? "—"}%`;
  }
  return log.valorNovo ?? "Alteração registrada";
}

export function HistoricoEtapa({ etapa }: HistoricoEtapaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Alterações</CardTitle>
      </CardHeader>
      <CardContent>
        {etapa.logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma alteração registrada.</p>
        ) : (
          <ScrollArea className="max-h-60">
            <ol className="space-y-0 pr-4">
              {etapa.logs.map((log, index) => {
                const Icone = iconeDoLog(log.tipo);

                return (
                  <li key={log.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < etapa.logs.length - 1 && (
                      <span className="absolute bottom-0 left-[11px] top-6 w-px bg-border" aria-hidden="true" />
                    )}
                    <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icone className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm">{textoDoLog(log)}</p>
                      <time className="block text-xs text-muted-foreground" dateTime={log.criadoEm}>
                        {format(new Date(log.criadoEm), "dd/MM/yyyy 'às' HH:mm")}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
