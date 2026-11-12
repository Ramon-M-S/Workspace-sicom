import { CalendarioMensal } from "@/components/calendario/calendario-mensal";
import { buscarEtapasCalendario } from "@/lib/queries/calendario";

export default async function Page() {
  const etapas = await buscarEtapasCalendario();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Calendário de Prazos</h1>
      <CalendarioMensal etapas={etapas} />
    </div>
  );
}
