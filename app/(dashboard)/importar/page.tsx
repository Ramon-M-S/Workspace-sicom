import { FileJson } from "lucide-react";
import { FormImportar } from "@/components/importar/form-importar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImportarPage() {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col gap-4">
      <div className="flex shrink-0 items-start gap-4">
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          <FileJson className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Importar Cronograma</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Cole um script JSON para criar fases e etapas de uma só vez. Cada etapa
            aparecerá no Kanban com seu status e no Calendário com as datas informadas.
          </p>
        </div>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <CardTitle>Script do cronograma</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col space-y-4">
          <FormImportar />
        </CardContent>
      </Card>

      <div className="shrink-0 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Formato esperado</p>
        <p className="mt-1">
          O objeto raiz contém <code className="font-mono">fases</code>. Cada fase
          contém <code className="font-mono">nome</code> e uma lista de
          <code className="font-mono"> etapas</code> com título, objetivo, datas no
          formato YYYY-MM-DD, status, entregáveis e critérios de conclusão (DoD).
        </p>
      </div>
    </div>
  );
}
