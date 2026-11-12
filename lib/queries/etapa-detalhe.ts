import { prisma } from "@/lib/prisma";

export async function buscarEtapaDetalhe(id: string) {
  return prisma.etapa.findUnique({
    where: { id },
    include: {
      fase: { select: { id: true, nome: true, ordem: true } },
      anotacoes: { orderBy: { criadoEm: "desc" } },
      lembretes: { orderBy: { diasAntes: "desc" } },
      anexos: true,
    },
  });
}
