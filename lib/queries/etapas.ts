import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth-utils";

export type FiltrosEtapas = {
  faseId?: string;
  status?: string;
  busca?: string;
};

export async function listarEtapasComFiltros(filtros: FiltrosEtapas) {
  const usuarioId = await getUsuarioLogado();
  return prisma.etapa.findMany({
    where: {
      usuarioId,
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
  const usuarioId = await getUsuarioLogado();
  return prisma.fase.findMany({
    where: { usuarioId },
    orderBy: { ordem: "asc" },
    select: { id: true, nome: true, ordem: true },
  });
}
