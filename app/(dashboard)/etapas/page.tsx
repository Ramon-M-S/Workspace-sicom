import { LinhaEtapa } from "@/components/roadmap/linha-etapa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listarEtapasComFiltros, listarFases } from "@/lib/queries/etapas";

type PageProps = {
  searchParams: { fase?: string; status?: string; q?: string };
};

export default async function Page({ searchParams }: PageProps) {
  const [fases, etapas] = await Promise.all([
    listarFases(),
    listarEtapasComFiltros({
      faseId: searchParams.fase,
      status: searchParams.status,
      busca: searchParams.q,
    }),
  ]);
  const grupos = fases
    .map((fase) => ({
      ...fase,
      etapas: etapas.filter((etapa) => etapa.fase.id === fase.id),
    }))
    .filter((fase) => fase.etapas.length > 0);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Etapas do TCC</h1>
          <p className="text-sm text-muted-foreground">
            {etapas.length} {etapas.length === 1 ? "etapa" : "etapas"} no total
          </p>
        </div>
      </div>

      <form method="GET" className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <select
          name="fase"
          defaultValue={searchParams.fase ?? ""}
          aria-label="Filtrar por fase"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">Todas as fases</option>
          {fases.map((fase) => (
            <option key={fase.id} value={fase.id}>
              {fase.nome}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          aria-label="Filtrar por status"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
        </select>

        <Input
          name="q"
          placeholder="Buscar por título..."
          defaultValue={searchParams.q ?? ""}
          aria-label="Buscar etapas por título"
        />
        <Button type="submit">Filtrar</Button>
      </form>

      {etapas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhuma etapa encontrada com esses filtros.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          {grupos.map((fase) => (
            <section key={fase.id} className="mb-8 space-y-2">
              <h2 className="mb-2 text-lg font-bold">{fase.nome}</h2>
              <div className="space-y-1">
                {fase.etapas.map((etapa) => (
                  <LinhaEtapa key={etapa.id} etapa={etapa} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
