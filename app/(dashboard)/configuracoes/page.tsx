import type { Metadata } from "next";
import { FormConfiguracoes } from "@/components/configuracoes/form-configuracoes";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Configurações | SICOM" };

export default async function ConfiguracoesPage() {
  const [configuracao, etapas, anotacoes] = await Promise.all([
    prisma.configuracao.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    }),
    prisma.etapa.count(),
    prisma.anotacao.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações do Sistema</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie as informações e a automação do seu projeto.
        </p>
      </div>
      <div className="flex flex-col gap-6 md:flex-row">
        <FormConfiguracoes configuracao={configuracao} etapas={etapas} anotacoes={anotacoes} />
      </div>
    </div>
  );
}
