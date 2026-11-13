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

export function NovaFaseDialog() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function criarFase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const valores = new FormData(form);
    setSalvando(true);
    try {
      const response = await fetch("/api/fases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: String(valores.get("nome") ?? ""),
          ordem: Number(valores.get("ordem")),
        }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const mensagem = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
          ? data.error
          : "Não foi possível criar a fase.";
        throw new Error(mensagem);
      }
      form.reset();
      setAberto(false);
      router.refresh();
      toast.success("Fase criada!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a fase.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline"><Plus className="h-4 w-4" />Nova fase</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova fase</DialogTitle>
          <DialogDescription>Adicione uma fase ao planejamento do TCC.</DialogDescription>
        </DialogHeader>
        <form onSubmit={criarFase} className="space-y-4">
          <label className="block space-y-2 text-sm font-medium">
            Nome
            <Input name="nome" required minLength={1} maxLength={120} />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            Ordem
            <Input name="ordem" type="number" min={0} step={1} defaultValue={1} required />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={salvando} onClick={() => setAberto(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
