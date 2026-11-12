import { prisma } from "@/lib/prisma";

export function registrarLog(
  etapaId: string,
  tipo: string,
  campo: string | null,
  valorAntigo: string | null,
  valorNovo: string | null,
) {
  return prisma.logAlteracao.create({
    data: { etapaId, tipo, campo, valorAntigo, valorNovo },
  });
}
