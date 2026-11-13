import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth-utils";

export async function buscarEtapaDetalhe(id: string) {
  const usuarioId = await getUsuarioLogado();
  return prisma.etapa.findFirst({
    where: { id, usuarioId },
    include: {
      fase: { select: { id: true, nome: true, ordem: true } },
      anotacoes: { where: { usuarioId }, orderBy: { criadoEm: "desc" } },
      lembretes: { orderBy: { diasAntes: "desc" } },
      anexos: { where: { usuarioId } },
      logs: { where: { usuarioId }, orderBy: { criadoEm: "desc" } },
    },
  });
}
