import { CalendarioMensal } from "@/components/calendario/calendario-mensal";
import { buscarEtapasCalendario } from "@/lib/queries/calendario";

export default async function Page() {
  const etapas = await buscarEtapasCalendario();

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <h1 className="shrink-0 text-2xl font-semibold">Calendário de Prazos</h1>
      <CalendarioMensal etapas={etapas} />
    </div>
  );
}
