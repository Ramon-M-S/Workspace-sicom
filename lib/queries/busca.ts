import { prisma } from "@/lib/prisma";

export async function buscarGlobal(termo: string, usuarioId: string) {
  if (termo.length < 2) {
    return { etapas: [], anotacoes: [] };
  }

  const [etapas, anotacoes] = await Promise.all([
    prisma.etapa.findMany({
      where: { usuarioId, titulo: { contains: termo, mode: "insensitive" } },
      take: 5,
    }),
    prisma.anotacao.findMany({
      where: { usuarioId, conteudo: { contains: termo, mode: "insensitive" } },
      take: 5,
      include: { etapa: { select: { id: true, titulo: true } } },
    }),
  ]);

  return { etapas, anotacoes };
}
