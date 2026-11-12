import { prisma } from "@/lib/prisma";

export async function buscarDadosKanban() {
  const etapas = await prisma.etapa.findMany({
    include: { fase: { select: { id: true, nome: true } } },
    orderBy: [{ fase: { ordem: "asc" } }, { ordem: "asc" }],
  });

  return {
    pendentes: etapas.filter((etapa) => etapa.status === "pendente"),
    emAndamento: etapas.filter((etapa) => etapa.status === "em_andamento"),
    concluidas: etapas.filter((etapa) => etapa.status === "concluida"),
  };
}
