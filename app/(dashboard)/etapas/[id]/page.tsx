import Link from "next/link";
import { notFound } from "next/navigation";
import { DetalheEtapa } from "@/components/etapas/detalhe-etapa";
import { buscarEtapaDetalhe } from "@/lib/queries/etapa-detalhe";

export default async function Page({ params }: { params: { id: string } }) {
  const etapa = await buscarEtapaDetalhe(params.id);
  if (!etapa) notFound();

  const etapaSerializada = {
    ...etapa,
    inicio: etapa.inicio.toISOString(),
    fim: etapa.fim.toISOString(),
    anotacoes: etapa.anotacoes.map((anotacao) => ({
      ...anotacao,
      criadoEm: anotacao.criadoEm.toISOString(),
      atualizadoEm: anotacao.atualizadoEm.toISOString(),
    })),
    lembretes: etapa.lembretes.map((lembrete) => ({
      ...lembrete,
      criadoEm: lembrete.criadoEm.toISOString(),
    })),
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href="/etapas" className="hover:text-foreground hover:underline">
          Etapas
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{etapa.titulo}</span>
      </nav>
      <DetalheEtapa etapa={etapaSerializada} />
    </div>
  );
}
