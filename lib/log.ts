import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth-utils";

export function registrarLog(
  etapaId: string,
  tipo: string,
  campo: string | null,
  valorAntigo: string | null,
  valorNovo: string | null,
) {
  return getUsuarioLogado().then((usuarioId) =>
    prisma.etapa.findFirstOrThrow({
      where: { id: etapaId, usuarioId },
      select: { usuarioId: true },
    }).then(() => prisma.logAlteracao.create({
      data: { etapaId, usuarioId, tipo, campo, valorAntigo, valorNovo },
    })),
  );
}
