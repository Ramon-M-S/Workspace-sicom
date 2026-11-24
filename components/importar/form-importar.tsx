"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const exemploCronograma = JSON.stringify(
  {
    fases: [
      {
        nome: "Planejamento",
        etapas: [
          {
            titulo: "Revisar o pré-projeto",
            objetivo: "Conferir o escopo, os objetivos e a estrutura inicial do trabalho.",
            inicio: "2027-01-05",
            fim: "2027-01-12",
            status: "em_andamento",
            entregaveis: ["Pré-projeto revisado"],
            dod: ["Objetivos revisados", "Escopo validado com a orientação"],
          },
          {
            titulo: "Organizar referências iniciais",
            objetivo: "Reunir as principais fontes para iniciar a revisão bibliográfica.",
            inicio: "2027-01-13",
            fim: "2027-01-20",
            status: "pendente",
            entregaveis: ["Lista inicial de referências"],
            dod: ["Fontes registradas e organizadas por tema"],
          },
        ],
      },
    ],
  },
  null,
  2,
);

function mensagemErro(data: unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }
  return "Não foi possível importar o cronograma.";
}

export function FormImportar() {
  const router = useRouter();
  const [script, setScript] = useState("");
  const [processando, setProcessando] = useState(false);

  async function processarScript() {
    let cronograma: unknown;
    try {
      cronograma = JSON.parse(script);
    } catch {
      toast.error("O texto não é um JSON válido. Confira a sintaxe e tente novamente.");
      return;
    }

    setProcessando(true);
    try {
      const response = await fetch("/api/etapas/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cronograma),
      });
      const resultado: unknown = await response.json();

      if (!response.ok) throw new Error(mensagemErro(resultado));

      const fasesCriadas =
        typeof resultado === "object" && resultado !== null && "fasesCriadas" in resultado
          ? resultado.fasesCriadas
          : undefined;
      const etapasCriadas =
        typeof resultado === "object" && resultado !== null && "etapasCriadas" in resultado
          ? resultado.etapasCriadas
          : undefined;
      toast.success(
        `Cronograma importado: ${String(fasesCriadas)} ${fasesCriadas === 1 ? "fase" : "fases"} e ${String(etapasCriadas)} ${etapasCriadas === 1 ? "etapa" : "etapas"}.`,
      );
      router.push("/etapas");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível importar o cronograma.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Cole abaixo o JSON do seu cronograma.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setScript(exemploCronograma)}
          disabled={processando}
        >
          Preencher Exemplo
        </Button>
      </div>
      <Textarea
        value={script}
        onChange={(event) => setScript(event.target.value)}
        aria-label="Script JSON do cronograma"
        placeholder={'{\n  "fases": []\n}'}
        className="min-h-[28rem] resize-y font-mono text-sm"
        spellCheck={false}
        disabled={processando}
      />
      <div className="flex justify-end">
        <Button type="button" onClick={processarScript} disabled={processando || !script.trim()}>
          {processando ? "Processando..." : "Processar Script"}
        </Button>
      </div>
    </div>
  );
}
