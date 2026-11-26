"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { Bell, Check, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type Notificacao = {
  id: string;
  titulo: string;
  fim: string;
  status: string;
  faseNome: string;
};

type DadosNotificacoes = {
      total: number;
  atrasadas: number;
  proximas: number;
  lista: Notificacao[];
};

export function Notificacoes() {
  const [dados, setDados] = useState<DadosNotificacoes | null>(null);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarNotificacoes() {
      try {
        const response = await fetch("/api/notificacoes");
        if (!response.ok) return;
        const resultado: DadosNotificacoes = await response.json();
        if (ativo) setDados(resultado);
      } catch {
        // Mantém o sino sem badge quando a API estiver indisponível.
      }
    }

    void carregarNotificacoes();
    return () => {
      ativo = false;
    };
  }, []);

  const hoje = startOfDay(new Date());

  return (
    <div className="relative z-50">
      {aberto && (
        <button
          type="button"
          aria-label="Fechar notificações"
          className="fixed inset-0 z-40 cursor-default bg-transparent"
          onClick={() => setAberto(false)}
        />
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notificações"
        aria-expanded={aberto}
        className={`relative ${aberto ? "z-50" : ""}`}
        onClick={() => setAberto(!aberto)}
      >
        <Bell className="h-5 w-5" />
        {!!dados?.total && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
            {dados.total > 9 ? "9+" : dados.total}
          </span>
        )}
      </Button>
      {aberto && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-md border bg-popover p-0 text-sm text-popover-foreground shadow-md sm:w-96">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-medium">Notificações</h2>
            <span className="text-xs text-muted-foreground">
              {dados?.total ?? 0} {dados?.total === 1 ? "notificação" : "notificações"}
            </span>
          </div>

          {!dados ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Carregando notificações...
            </p>
          ) : dados.lista.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              Tudo em dia!
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <ul className="divide-y">
                {dados.lista.map((etapa) => {
                  const diasRestantes = differenceInCalendarDays(
                    startOfDay(new Date(etapa.fim)),
                    hoje,
                  );
                  const atrasada = diasRestantes < 0;

                  return (
                    <li key={etapa.id}>
                      <Link
                        href={`/etapas/${encodeURIComponent(etapa.id)}`}
                        onClick={() => setAberto(false)}
                        className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                      >
                        {atrasada ? (
                          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-brass-foreground" />
                        ) : (
                          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {etapa.titulo}
                          </span>
                          <span
                            className={`mt-0.5 block text-xs ${
                              "text-muted-foreground"
                            }`}
                          >
                            {atrasada
                              ? `Pendente desde ${new Date(etapa.fim).toLocaleDateString("pt-BR")}`
                              : `Vence em ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}`}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}

          <div className="border-t px-4 py-3">
            <Link
              href="/dashboard"
              onClick={() => setAberto(false)}
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
