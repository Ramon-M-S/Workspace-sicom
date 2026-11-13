import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth-utils";

export async function buscarEtapasCalendario() {
  const usuarioId = await getUsuarioLogado();
  return prisma.etapa.findMany({
    where: { usuarioId },
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
