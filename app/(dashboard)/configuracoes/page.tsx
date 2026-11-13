import type { Metadata } from "next";
import { FormConfiguracoes } from "@/components/configuracoes/form-configuracoes";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth-utils";

export const metadata: Metadata = { title: "Configurações | SICOM" };

export default async function ConfiguracoesPage() {
  const usuarioId = await getUsuarioLogado();
  const [configuracao, etapas, anotacoes] = await Promise.all([
    prisma.configuracao.upsert({
      where: { usuarioId },
      create: { usuarioId },
      update: {},
    }),
    prisma.etapa.count({ where: { usuarioId } }),
    prisma.anotacao.count({ where: { usuarioId } }),
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
