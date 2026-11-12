import { prisma } from "@/lib/prisma";

export async function buscarEtapasCalendario() {
  return prisma.etapa.findMany({
    select: {
      id: true,
      titulo: true,
      inicio: true,
      fim: true,
      status: true,
      fase: { select: { nome: true } },
    },
    orderBy: [{ inicio: "asc" }, { titulo: "asc" }],
  });
}
