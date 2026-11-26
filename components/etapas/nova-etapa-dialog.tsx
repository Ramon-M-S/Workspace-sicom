"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function itensPorLinha(valor: FormDataEntryValue | null) {
  return String(valor ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function NovaEtapaDialog({ fases }: { fases: Array<{ id: string; nome: string }> }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  async function criarEtapa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErros({});
    const form = event.currentTarget;
    const valores = new FormData(form);
    const inicio = String(valores.get("inicio") ?? "");
    const fim = String(valores.get("fim") ?? "");
    const faseId = String(valores.get("faseId") ?? "");
    if (!faseId) {
      setErros({ faseId: "Selecione uma fase para continuar." });
      return;
    }
    const payload = {
      titulo: String(valores.get("titulo") ?? ""),
      faseId,
      ordem: Number(valores.get("ordem")),
      objetivo: String(valores.get("objetivo") ?? ""),
      inicio: new Date(`${inicio}T00:00:00.000Z`).toISOString(),
      fim: new Date(`${fim}T00:00:00.000Z`).toISOString(),
      entregaveis: itensPorLinha(valores.get("entregaveis")),
      dod: itensPorLinha(valores.get("dod")),
    };

    setSalvando(true);
    try {
      const response = await fetch("/api/etapas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        let possuiErrosDeCampo = false;
        if (typeof data === "object" && data !== null && "details" in data) {
          const details = data.details;
          if (typeof details === "object" && details !== null && "fieldErrors" in details) {
            const fieldErrors = details.fieldErrors;
            if (typeof fieldErrors === "object" && fieldErrors !== null) {
              possuiErrosDeCampo = Object.keys(fieldErrors).length > 0;
              setErros(Object.fromEntries(Object.entries(fieldErrors).map(([key, value]) => [key, Array.isArray(value) ? String(value[0] ?? "Revise este campo.") : "Revise este campo."])));
            }
          }
        }
        const mensagem =
          typeof data === "object" && data !== null && "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Não foi possível criar a etapa.";
        throw new Error(possuiErrosDeCampo ? "Revise os campos destacados e tente de novo." : mensagem);
      }

      form.reset();
      setAberto(false);
      router.refresh();
      toast.success("Etapa criada!");
    } catch (error) {
      toast.error(error instanceof Error && error.message.startsWith("Revise") ? error.message : "Não conseguimos criar a etapa. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Nova etapa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova etapa</DialogTitle>
          <DialogDescription>
            Preencha os dados da etapa do seu TCC.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={criarEtapa} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="etapa-titulo">Título</Label><Input id="etapa-titulo" name="titulo" required minLength={3} maxLength={200} aria-invalid={!!erros.titulo} aria-describedby={erros.titulo ? "etapa-titulo-erro" : undefined} />{erros.titulo && <p id="etapa-titulo-erro" role="alert" className="text-sm text-destructive">Informe um título com pelo menos 3 caracteres.</p>}</div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="etapa-fase">Fase</Label>
              <select
                id="etapa-fase"
                name="faseId"
                defaultValue={fases[0]?.id ?? ""}
                required
                aria-invalid={!!erros.faseId}
                aria-describedby={erros.faseId ? "etapa-fase-erro" : undefined}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {fases.map((fase) => (
                  <option key={fase.id} value={fase.id}>
                    {fase.nome}
                  </option>
                ))}
              </select>
              {erros.faseId && <p id="etapa-fase-erro" role="alert" className="text-sm text-destructive">{erros.faseId}</p>}
            </div>
            <div className="space-y-2"><Label htmlFor="etapa-ordem">Ordem</Label><Input id="etapa-ordem" name="ordem" type="number" min={0} step={1} defaultValue={1} required aria-invalid={!!erros.ordem} aria-describedby={erros.ordem ? "etapa-ordem-erro" : undefined} />{erros.ordem && <p id="etapa-ordem-erro" role="alert" className="text-sm text-destructive">Informe uma ordem igual ou maior que zero.</p>}</div>
          </div>

          <div className="space-y-2"><Label htmlFor="etapa-objetivo">Objetivo</Label><Textarea id="etapa-objetivo" name="objetivo" required minLength={10} maxLength={1000} aria-invalid={!!erros.objetivo} aria-describedby={erros.objetivo ? "etapa-objetivo-erro" : undefined} />{erros.objetivo && <p id="etapa-objetivo-erro" role="alert" className="text-sm text-destructive">Descreva o objetivo com pelo menos 10 caracteres.</p>}</div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="etapa-inicio">Data de Início</Label><Input id="etapa-inicio" name="inicio" type="date" required aria-invalid={!!erros.inicio} aria-describedby={erros.inicio ? "etapa-inicio-erro" : undefined} />{erros.inicio && <p id="etapa-inicio-erro" role="alert" className="text-sm text-destructive">Informe uma data de início válida.</p>}</div>
            <div className="space-y-2"><Label htmlFor="etapa-fim">Data de Fim</Label><Input id="etapa-fim" name="fim" type="date" required aria-invalid={!!erros.fim} aria-describedby={erros.fim ? "etapa-fim-erro" : undefined} />{erros.fim && <p id="etapa-fim-erro" role="alert" className="text-sm text-destructive">Informe uma data de fim igual ou posterior ao início.</p>}</div>
          </div>

          <div className="space-y-2"><Label htmlFor="etapa-entregaveis">Entregáveis <span className="font-normal text-muted-foreground">(um item por linha)</span></Label><Textarea id="etapa-entregaveis" name="entregaveis" required placeholder={"Documento revisado\nReferências consolidadas"} aria-invalid={!!erros.entregaveis} aria-describedby={erros.entregaveis ? "etapa-entregaveis-erro" : undefined} />{erros.entregaveis && <p id="etapa-entregaveis-erro" role="alert" className="text-sm text-destructive">Informe pelo menos um entregável.</p>}</div>

          <div className="space-y-2"><Label htmlFor="etapa-dod">Critérios de conclusão <span className="font-normal text-muted-foreground">(um item por linha)</span></Label><Textarea id="etapa-dod" name="dod" required placeholder={"Conteúdo revisado\nCritérios atendidos"} aria-invalid={!!erros.dod} aria-describedby={erros.dod ? "etapa-dod-erro" : undefined} />{erros.dod && <p id="etapa-dod-erro" role="alert" className="text-sm text-destructive">Informe pelo menos um critério.</p>}</div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={salvando}
              onClick={() => setAberto(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
