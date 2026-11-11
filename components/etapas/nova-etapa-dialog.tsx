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
import { Textarea } from "@/components/ui/textarea";

const fases = [
  { id: "fase-planejamento", nome: "Planejamento" },
  { id: "fase-analise", nome: "Análise" },
  { id: "fase-projeto", nome: "Projeto" },
  { id: "fase-desenvolvimento", nome: "Desenvolvimento" },
  { id: "fase-monografia", nome: "Monografia" },
];

function itensPorLinha(valor: FormDataEntryValue | null) {
  return String(valor ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function NovaEtapaDialog() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function criarEtapa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const valores = new FormData(form);
    const inicio = String(valores.get("inicio") ?? "");
    const fim = String(valores.get("fim") ?? "");
    const payload = {
      titulo: String(valores.get("titulo") ?? ""),
      faseId: String(valores.get("faseId") ?? ""),
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
        const mensagem =
          typeof data === "object" && data !== null && "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Não foi possível criar a etapa.";
        throw new Error(mensagem);
      }

      form.reset();
      setAberto(false);
      router.refresh();
      toast.success("Etapa criada!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a etapa.");
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
            Preencha os dados da etapa do TCC SICOM.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={criarEtapa} className="space-y-4">
          <label className="block space-y-2 text-sm font-medium">
            Título
            <Input name="titulo" required minLength={3} maxLength={200} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-sm font-medium">
              Fase
              <select
                name="faseId"
                defaultValue={fases[0].id}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {fases.map((fase) => (
                  <option key={fase.id} value={fase.id}>
                    {fase.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Ordem
              <Input name="ordem" type="number" min={0} step={1} defaultValue={1} required />
            </label>
          </div>

          <label className="block space-y-2 text-sm font-medium">
            Objetivo
            <Textarea name="objetivo" required minLength={10} maxLength={1000} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-sm font-medium">
              Data de Início
              <Input name="inicio" type="date" required />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Data de Fim
              <Input name="fim" type="date" required />
            </label>
          </div>

          <label className="block space-y-2 text-sm font-medium">
            Entregáveis <span className="font-normal text-muted-foreground">(um item por linha)</span>
            <Textarea name="entregaveis" required placeholder={"Documento revisado\nReferências consolidadas"} />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            Definition of Done <span className="font-normal text-muted-foreground">(um item por linha)</span>
            <Textarea name="dod" required placeholder={"Conteúdo revisado\nCritérios atendidos"} />
          </label>

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
