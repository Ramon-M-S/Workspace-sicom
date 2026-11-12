import { KanbanBoard } from "@/components/kanban/kanban-board";
import { buscarDadosKanban } from "@/lib/queries/kanban";

export default async function KanbanPage() {
  const dados = await buscarDadosKanban();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Kanban do TCC</h1>
        <p className="text-sm text-muted-foreground">
          Arraste os cards para atualizar o status
        </p>
      </div>
      <KanbanBoard dados={dados} />
    </div>
  );
}
