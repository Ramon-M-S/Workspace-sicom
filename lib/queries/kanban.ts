import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth-utils";

export async function buscarDadosKanban() {
  const usuarioId = await getUsuarioLogado();
  const etapas = await prisma.etapa.findMany({
    where: { usuarioId },
    include: { fase: { select: { id: true, nome: true } } },
    orderBy: [{ fase: { ordem: "asc" } }, { ordem: "asc" }],
  });

  return {
    pendentes: etapas.filter((etapa) => etapa.status === "pendente"),
    emAndamento: etapas.filter((etapa) => etapa.status === "em_andamento"),
    concluidas: etapas.filter((etapa) => etapa.status === "concluida"),
  };
}
