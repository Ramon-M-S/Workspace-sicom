import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { calcularProximos } from "@/lib/lembretes";
import { prisma } from "@/lib/prisma";

export async function buscarDadosDashboard(): Promise<{
  fases: Array<{
    id: string;
    nome: string;
    ordem: number;
    totalEtapas: number;
    etapasConcluidas: number;
    progressoMedio: number;
  }>;
  proximaEtapa: {
    id: string;
    titulo: string;
    faseNome: string;
    fim: string;
    diasRestantes: number;
    status: string;
  } | null;
  totais: {
    etapas: number;
    concluidas: number;
    emAndamento: number;
    pendentes: number;
    atrasadas: number;
    progressoGeral: number;
  };
  lembretesProximos: Array<{
    etapaId: string;
    titulo: string;
    fim: string;
    diasRestantes: number;
    lembretesHoje: number;
    lembretesProximos: number;
  }>;
}> {
  const agora = new Date();
  const inicioHoje = startOfDay(agora);
  const fimJanelaLembretes = addDays(agora, 7);

  const fasesComEtapas = await prisma.fase.findMany({
    orderBy: { ordem: "asc" },
    include: { etapas: true },
  });

  const todasEtapas = fasesComEtapas.flatMap((fase) =>
    fase.etapas.map((etapa) => ({ ...etapa, faseNome: fase.nome })),
  );
  const totalEtapas = todasEtapas.length;
  const concluidas = todasEtapas.filter((etapa) => etapa.status === "concluida").length;
  const emAndamento = todasEtapas.filter((etapa) => etapa.status === "em_andamento").length;
  const pendentes = todasEtapas.filter((etapa) => etapa.status === "pendente").length;
  const atrasadas = todasEtapas.filter(
    (etapa) => etapa.fim < inicioHoje && etapa.status !== "concluida",
  ).length;
  const progressoGeral = totalEtapas
    ? Math.round(todasEtapas.reduce((soma, etapa) => soma + etapa.progresso, 0) / totalEtapas)
    : 0;

  const fases = fasesComEtapas.map((fase) => {
    const quantidade = fase.etapas.length;
    return {
      id: fase.id,
      nome: fase.nome,
      ordem: fase.ordem,
      totalEtapas: quantidade,
      etapasConcluidas: fase.etapas.filter((etapa) => etapa.status === "concluida").length,
      progressoMedio: quantidade
        ? Math.round(fase.etapas.reduce((soma, etapa) => soma + etapa.progresso, 0) / quantidade)
        : 0,
    };
  });

  const proxima = todasEtapas
    .filter((etapa) => etapa.status !== "concluida" && etapa.fim >= inicioHoje)
    .sort((a, b) => a.fim.getTime() - b.fim.getTime())[0];

  const etapasComLembretes = await prisma.etapa.findMany({
    where: {
      fim: { lte: fimJanelaLembretes },
      status: { not: "concluida" },
    },
    select: {
      id: true,
      titulo: true,
      fim: true,
      lembretes: {
        select: { id: true, diasAntes: true, canal: true, enviado: true },
      },
    },
  });

  const lembretesProximos = calcularProximos(etapasComLembretes, agora, 7).map((etapa) => ({
    etapaId: etapa.etapaId,
    titulo: etapa.titulo,
    fim: etapa.fim,
    diasRestantes: etapa.diasRestantes,
    lembretesHoje: etapa.lembretesHoje.length,
    lembretesProximos: etapa.lembretesProximos.length,
  }));

  return {
    fases,
    proximaEtapa: proxima
      ? {
          id: proxima.id,
          titulo: proxima.titulo,
          faseNome: proxima.faseNome,
          fim: proxima.fim.toISOString(),
          diasRestantes: differenceInCalendarDays(proxima.fim, agora),
          status: proxima.status,
        }
      : null,
    totais: {
      etapas: totalEtapas,
      concluidas,
      emAndamento,
      pendentes,
      atrasadas,
      progressoGeral,
    },
    lembretesProximos,
  };
}
