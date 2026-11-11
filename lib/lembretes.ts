import { differenceInCalendarDays, endOfDay, startOfDay } from "date-fns";

export type LembreteCalculado = {
  id: string;
  diasAntes: number;
  canal: string;
  dataAlvo: string;
  atrasado: boolean;
};

export type EtapaComLembretes = {
  etapaId: string;
  titulo: string;
  fim: string;
  diasRestantes: number;
  lembretesHoje: LembreteCalculado[];
  lembretesProximos: LembreteCalculado[];
};

type EtapaInput = {
  id: string;
  titulo: string;
  fim: Date;
  lembretes: Array<{
    id: string;
    diasAntes: number;
    canal: string;
    enviado: boolean;
  }>;
};

const DIA_EM_MS = 24 * 60 * 60 * 1000;

// date-fns trabalha com o fuso local. Este valor auxiliar representa a data UTC
// como uma data local, permitindo usar startOfDay/endOfDay sem mudar o dia UTC.
function comoDataCalendarioUtc(data: Date): Date {
  return new Date(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());
}

export function calcularProximos(
  etapas: EtapaInput[],
  hoje: Date,
  janelaDias: number = 7,
): EtapaComLembretes[] {
  const hojeCalendario = comoDataCalendarioUtc(hoje);
  const inicioHoje = startOfDay(hojeCalendario);
  const fimHoje = endOfDay(hojeCalendario);
  const inicioAmanha = startOfDay(
    comoDataCalendarioUtc(new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() + 1))),
  );
  const fimJanela = endOfDay(
    comoDataCalendarioUtc(new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() + janelaDias))),
  );

  return etapas
    .map((etapa) => {
      const lembretesHoje: LembreteCalculado[] = [];
      const lembretesProximos: LembreteCalculado[] = [];

      for (const lembrete of etapa.lembretes) {
        if (lembrete.enviado) continue;

        const dataAlvo = new Date(etapa.fim.getTime() - lembrete.diasAntes * DIA_EM_MS);
        const dataAlvoCalendario = comoDataCalendarioUtc(dataAlvo);
        const calculado: LembreteCalculado = {
          id: lembrete.id,
          diasAntes: lembrete.diasAntes,
          canal: lembrete.canal,
          dataAlvo: dataAlvo.toISOString(),
          atrasado: dataAlvoCalendario < inicioHoje,
        };

        if (dataAlvoCalendario < inicioHoje || (dataAlvoCalendario >= inicioHoje && dataAlvoCalendario <= fimHoje)) {
          lembretesHoje.push(calculado);
        } else if (dataAlvoCalendario >= inicioAmanha && dataAlvoCalendario <= fimJanela) {
          lembretesProximos.push(calculado);
        }
      }

      const fimCalendario = comoDataCalendarioUtc(etapa.fim);
      return {
        etapaId: etapa.id,
        titulo: etapa.titulo,
        fim: etapa.fim.toISOString(),
        diasRestantes: differenceInCalendarDays(fimCalendario, hojeCalendario),
        lembretesHoje,
        lembretesProximos,
      };
    })
    .filter((etapa) => etapa.lembretesHoje.length > 0 || etapa.lembretesProximos.length > 0)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
}
