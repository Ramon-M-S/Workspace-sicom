import { addDays, endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { handleError, ok } from "@/lib/http";

export async function GET() {
  try {
    const hoje = startOfDay(new Date());
    const fimJanela = endOfDay(addDays(hoje, 7));

    const etapas = await prisma.etapa.findMany({
      where: {
        status: { not: "concluida" },
        fim: { lte: fimJanela },
      },
      orderBy: { fim: "asc" },
      select: {
        id: true,
        titulo: true,
        fim: true,
        status: true,
        fase: { select: { nome: true } },
      },
    });

    const atrasadas = etapas.filter((etapa) => etapa.fim < hoje).length;
    const proximas = etapas.filter((etapa) => etapa.fim >= hoje).length;

    return ok({
      total: etapas.length,
      atrasadas,
      proximas,
      lista: etapas.slice(0, 5).map(({ fase, ...etapa }) => ({
        ...etapa,
        faseNome: fase.nome,
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
