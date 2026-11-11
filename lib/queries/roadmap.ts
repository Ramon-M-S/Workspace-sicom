import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function buscarDadosRoadmap() {
  const [fases, etapas] = await Promise.all([
    prisma.fase.findMany({
      orderBy: { ordem: "asc" },
      include: {
        etapas: {
          select: {
            id: true,
            titulo: true,
            inicio: true,
            fim: true,
            status: true,
          },
          orderBy: { ordem: "asc" },
        },
      },
    }),
    prisma.etapa.findMany({
      select: {
        id: true,
        titulo: true,
        inicio: true,
        fim: true,
        status: true,
        fase: { select: { id: true, nome: true } },
      },
    }),
  ]);

  const hoje = startOfDay(new Date());
  const limiteUrgencia = addDays(hoje, 14);
  const dataCalendario = (data: Date) =>
    new Date(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());
  const etapasUrgentes = etapas
    .filter(
      (etapa) =>
        etapa.status !== "concluida" && dataCalendario(etapa.fim) <= limiteUrgencia,
    )
    .sort((a, b) => a.fim.getTime() - b.fim.getTime());

  const datas = etapas.flatMap((etapa) => [etapa.inicio, etapa.fim]);
  const dataInicio = datas.length
    ? new Date(Math.min(...datas.map((data) => data.getTime())))
    : hoje;
  const dataFim = datas.length
    ? new Date(Math.max(...datas.map((data) => data.getTime())))
    : hoje;
  const totalDias = Math.max(differenceInCalendarDays(dataFim, dataInicio) + 1, 1);

  return { fases, dataInicio, dataFim, totalDias, etapasUrgentes };
}
