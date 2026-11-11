"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ListChecks } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

type Resultados = {
  etapas: { id: string; titulo: string }[];
  anotacoes: {
    id: string;
    etapaId: string;
    conteudo: string;
    etapa: { id: string; titulo: string };
  }[];
};

type BuscaGlobalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BuscaGlobal({ open, onOpenChange }: BuscaGlobalProps) {
  const router = useRouter();
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<Resultados>({
    etapas: [],
    anotacoes: [],
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (termo.length <= 2) {
      setResultados({ etapas: [], anotacoes: [] });
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/busca?q=${encodeURIComponent(termo)}`);
        if (!response.ok) return;
        const data: Resultados = await response.json();
        setResultados(data);
      } catch {
        setResultados({ etapas: [], anotacoes: [] });
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [termo]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Busca global"
      description="Busque etapas e anotações"
    >
      <CommandInput
        placeholder="Buscar etapas, anotações..."
        onValueChange={setTermo}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {resultados.etapas.length > 0 && (
          <CommandGroup heading="Etapas">
            {resultados.etapas.map((etapa) => (
              <CommandItem
                key={etapa.id}
                value={`etapa-${etapa.id}`}
                onSelect={() => {
                  router.push(`/etapas/${etapa.id}`);
                  onOpenChange(false);
                }}
              >
                <ListChecks className="mr-2 h-4 w-4 text-muted-foreground" />
                {etapa.titulo}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {resultados.anotacoes.length > 0 && (
          <CommandGroup heading="Anotações">
            {resultados.anotacoes.map((anotacao) => (
              <CommandItem
                key={anotacao.id}
                value={`anotacao-${anotacao.id}`}
                onSelect={() => {
                  router.push(`/etapas/${anotacao.etapaId}`);
                  onOpenChange(false);
                }}
              >
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                {anotacao.conteudo.slice(0, 50)}... (em {anotacao.etapa.titulo})
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
