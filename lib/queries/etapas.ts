import { prisma } from "@/lib/prisma";

export type FiltrosEtapas = {
  faseId?: string;
  status?: string;
  busca?: string;
};

export async function listarEtapasComFiltros(filtros: FiltrosEtapas) {
  return prisma.etapa.findMany({
    where: {
      faseId: filtros.faseId || undefined,
      status: filtros.status || undefined,
      titulo: filtros.busca
        ? { contains: filtros.busca, mode: "insensitive" }
        : undefined,
    },
    include: {
      fase: { select: { id: true, nome: true, ordem: true } },
      _count: { select: { anotacoes: true } },
    },
    orderBy: [{ fase: { ordem: "asc" } }, { ordem: "asc" }],
  });
}

export async function listarFases() {
  return prisma.fase.findMany({
    orderBy: { ordem: "asc" },
    select: { id: true, nome: true, ordem: true },
  });
}
