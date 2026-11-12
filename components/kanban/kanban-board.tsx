"use client";

import { useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";

type EtapaKanban = {
  id: string;
  titulo: string;
  fim: Date | string;
  status: string;
  fase: { id: string; nome: string };
};

type ColunaId = "pendente" | "em_andamento" | "concluida";
type DadosKanban = {
  pendentes: EtapaKanban[];
  emAndamento: EtapaKanban[];
  concluidas: EtapaKanban[];
};

const colunas: Array<{ id: ColunaId; titulo: string }> = [
  { id: "pendente", titulo: "Pendente" },
  { id: "em_andamento", titulo: "Em andamento" },
  { id: "concluida", titulo: "Concluída" },
];

function dataCalendario(data: Date | string) {
  const valor = data instanceof Date ? data : new Date(data);
  return new Date(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate());
}

export function KanbanBoard({ dados }: { dados: DadosKanban }) {
  const [etapas, setEtapas] = useState<Record<ColunaId, EtapaKanban[]>>({
    pendente: dados.pendentes,
    em_andamento: dados.emAndamento,
    concluida: dados.concluidas,
  });

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;

    const origem = source.droppableId as ColunaId;
    const destino = destination.droppableId as ColunaId;
    const etapa = etapas[origem][source.index];
    if (!etapa || etapa.id !== draggableId) return;

    const anterior = etapas;
    const novasEtapas = { ...etapas };
    novasEtapas[origem] = [...etapas[origem]];
    novasEtapas[destino] = [...etapas[destino]];
    novasEtapas[origem].splice(source.index, 1);
    novasEtapas[destino].splice(destination.index, 0, { ...etapa, status: destino });
    setEtapas(novasEtapas);

    try {
      const resposta = await fetch(`/api/etapas/${etapa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: destino }),
      });
      if (!resposta.ok) throw new Error("Falha ao atualizar status da etapa");
    } catch {
      setEtapas(anterior);
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {colunas.map((coluna) => (
          <Droppable key={coluna.id} droppableId={coluna.id}>
            {(dropProvided, snapshot) => (
              <section
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className={`min-h-48 rounded-lg bg-muted/40 p-3 ${snapshot.isDraggingOver ? "bg-muted" : ""}`}
              >
                <h2 className="mb-3 font-semibold">
                  {coluna.titulo} ({etapas[coluna.id].length})
                </h2>
                <div className="space-y-3">
                  {etapas[coluna.id].map((etapa, indice) => {
                    const fim = dataCalendario(etapa.fim);
                    const diasRestantes = differenceInCalendarDays(fim, dataCalendario(new Date()));
                    const urgente = etapa.status !== "concluida" && diasRestantes <= 14;
                    const corUrgencia = etapa.status === "concluida"
                      ? "bg-muted"
                      : diasRestantes < 0
                        ? "bg-red-500"
                        : urgente
                          ? "bg-amber-500"
                          : "bg-muted";

                    return (
                      <Draggable key={etapa.id} draggableId={etapa.id} index={indice}>
                        {(dragProvided, dragSnapshot) => (
                          <article
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={`rounded-md border bg-card p-3 shadow-sm ${dragSnapshot.isDragging ? "shadow-md" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-medium">{etapa.titulo}</p>
                              <span
                                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${corUrgencia}`}
                                aria-label={diasRestantes < 0 ? "Prazo vencido" : urgente ? "Prazo próximo" : "Prazo futuro"}
                                title={diasRestantes < 0 ? "Prazo vencido" : urgente ? "Prazo próximo" : "Prazo futuro"}
                              />
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">{etapa.fase.nome}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Data de fim: {format(fim, "dd/MM/yyyy")}
                            </p>
                          </article>
                        )}
                      </Draggable>
                    );
                  })}
                </div>
                {dropProvided.placeholder}
              </section>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
