import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { AlertCircle, ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GanttInterativo } from "@/components/roadmap/gantt-interativo";
import { buscarDadosRoadmap } from "@/lib/queries/roadmap";

function dataCalendario(data: Date) {
  return new Date(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());
}

export default async function Page() {
  const { fases, dataInicio, dataFim, totalDias, etapasUrgentes } =
    await buscarDadosRoadmap();
  const hoje = startOfDay(new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Roadmap do TCC</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do cronograma, das fases e dos prazos que exigem atenção.
        </p>
      </div>

      <GanttInterativo
        fases={fases}
        dataInicio={dataInicio}
        dataFim={dataFim}
        totalDias={totalDias}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
            <span>Atenção Imediata (Próximos 14 dias)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {etapasUrgentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tudo sob controle!</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {etapasUrgentes.map((etapa) => {
                const fim = dataCalendario(etapa.fim);
                const diasRestantes = differenceInCalendarDays(fim, hoje);
                const atrasada = diasRestantes < 0;

                return (
                  <Card
                    key={etapa.id}
                    className={`border-l-4 ${atrasada ? "border-l-red-500" : "border-l-amber-500"}`}
                  >
                    <CardContent className="flex h-full flex-col gap-3 py-4">
                      <p className="text-xs uppercase text-muted-foreground">
                        {etapa.fase.nome}
                      </p>
                      <h3 className="font-semibold text-base">{etapa.titulo}</h3>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                        Vence em {format(fim, "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <div className="mt-auto flex items-end justify-between gap-3 pt-1">
                        <p className={`text-sm ${atrasada ? "text-red-600" : "text-orange-600"}`}>
                          {atrasada
                            ? `Atrasada há ${Math.abs(diasRestantes)} ${Math.abs(diasRestantes) === 1 ? "dia" : "dias"}`
                            : `Faltam ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}`}
                        </p>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/etapas/${etapa.id}`}>
                            Ver etapa
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
