"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, Check, Download, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { gerarLinkGoogleAgenda } from "@/lib/calendar";
import type {
  Anotacao,
  Etapa,
  Fase,
  Lembrete,
} from "@/lib/generated/prisma/client";

type EtapaDetalhe = Omit<Etapa, "inicio" | "fim"> & {
  inicio: string;
  fim: string;
  fase: Pick<Fase, "id" | "nome" | "ordem">;
  anotacoes: Array<
    Omit<Anotacao, "criadoEm" | "atualizadoEm"> & {
      criadoEm: string;
      atualizadoEm: string;
    }
  >;
  lembretes: Array<Omit<Lembrete, "criadoEm"> & { criadoEm: string }>;
};

type ApiResult = { ok: true; data: unknown };

async function chamarApi(
  url: string,
  method: "PATCH" | "POST" | "DELETE",
  body?: Record<string, unknown>,
): Promise<ApiResult> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data: unknown = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const mensagem =
      typeof data === "object" && data !== null && "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Não foi possível concluir a operação.";
    throw new Error(mensagem);
  }

  return { ok: true, data };
}

function formatarData(data: Date | string) {
  return format(data instanceof Date ? data : new Date(data), "dd/MM/yyyy 'às' HH:mm");
}

function labelStatus(status: string) {
  if (status === "em_andamento") return "Em andamento";
  if (status === "concluida") return "Concluída";
  return "Pendente";
}

function classesStatus(status: string) {
  if (status === "em_andamento") return "bg-blue-100 text-blue-800 hover:bg-blue-100";
  if (status === "concluida") return "bg-green-100 text-green-800 hover:bg-green-100";
  return "bg-muted text-muted-foreground";
}

function varianteStatus(status: string): "outline" | "default" | "secondary" {
  if (status === "em_andamento") return "default";
  if (status === "concluida") return "secondary";
  return "outline";
}

export function DetalheEtapa({ etapa }: { etapa: EtapaDetalhe }) {
  const router = useRouter();
  const [progresso, setProgresso] = useState(etapa.progresso);
  const [novaAnotacao, setNovaAnotacao] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState("");
  const [anotacaoParaExcluir, setAnotacaoParaExcluir] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function atualizarEtapa(dados: { status?: string; progresso?: number }) {
    setSalvando(true);
    try {
      await chamarApi(`/api/etapas/${etapa.id}`, "PATCH", dados);
      if (dados.progresso !== undefined) setProgresso(dados.progresso);
      toast.success("Etapa atualizada com sucesso.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar etapa.");
    } finally {
      setSalvando(false);
    }
  }

  async function adicionarAnotacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSalvando(true);
    try {
      await chamarApi(`/api/etapas/${etapa.id}/anotacoes`, "POST", {
        conteudo: novaAnotacao,
      });
      setNovaAnotacao("");
      toast.success("Anotação adicionada.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar anotação.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEdicao(anotacaoId: string) {
    setSalvando(true);
    try {
      await chamarApi(`/api/anotacoes/${anotacaoId}`, "PATCH", {
        conteudo: textoEdicao,
      });
      setEditandoId(null);
      setTextoEdicao("");
      toast.success("Anotação atualizada.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar anotação.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirAnotacao() {
    if (!anotacaoParaExcluir) return;
    setSalvando(true);
    try {
      await chamarApi(`/api/anotacoes/${anotacaoParaExcluir}`, "DELETE");
      setAnotacaoParaExcluir(null);
      toast.success("Anotação excluída.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir anotação.");
    } finally {
      setSalvando(false);
    }
  }

  const linkAgenda = gerarLinkGoogleAgenda({
    id: etapa.id,
    titulo: etapa.titulo,
    objetivo: etapa.objetivo,
    inicio: new Date(etapa.inicio),
    fim: new Date(etapa.fim),
    entregaveis: etapa.entregaveis,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{etapa.titulo}</h1>
          <Badge variant={varianteStatus(etapa.status)} className={classesStatus(etapa.status)}>
            {labelStatus(etapa.status)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {etapa.fase.nome} · {format(new Date(etapa.inicio), "dd/MM/yyyy")} – {format(new Date(etapa.fim), "dd/MM/yyyy")}
        </p>
      </header>

      <Card>
        <CardHeader><CardTitle>Objetivo</CardTitle></CardHeader>
        <CardContent><p className="whitespace-pre-wrap">{etapa.objetivo}</p></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Entregáveis</CardTitle></CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5">
            {etapa.entregaveis.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Definition of Done</CardTitle></CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5">
            {etapa.dod.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Atualizar etapa</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={etapa.status === "pendente" ? "default" : "outline"}
              disabled={salvando || etapa.status === "pendente"}
              onClick={() => atualizarEtapa({ status: "pendente" })}
            >
              Pendente
            </Button>
            <Button
              type="button"
              variant={etapa.status === "em_andamento" ? "default" : "outline"}
              disabled={salvando || etapa.status === "em_andamento"}
              onClick={() => atualizarEtapa({ status: "em_andamento" })}
            >
              Em andamento
            </Button>
            <Button
              type="button"
              variant={etapa.status === "concluida" ? "secondary" : "outline"}
              disabled={salvando || etapa.status === "concluida"}
              onClick={() => atualizarEtapa({ status: "concluida", progresso: 100 })}
            >
              Concluída
            </Button>
          </div>

          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              atualizarEtapa({ progresso });
            }}
          >
            <label className="flex-1 space-y-2 text-sm font-medium">
              Progresso (%)
              <Input
                type="number"
                min={0}
                max={100}
                step={1}
                value={progresso}
                onChange={(event) => setProgresso(Number(event.target.value))}
              />
            </label>
            <Button type="submit" variant="outline" disabled={salvando}>
              Atualizar progresso
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Calendário</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <a href={linkAgenda} target="_blank" rel="noopener noreferrer">
              <Calendar className="h-4 w-4" />
              Adicionar ao Google Agenda
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/api/etapas/${etapa.id}/ics`} download>
              <Download className="h-4 w-4" />
              Baixar .ics
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anotações ({etapa.anotacoes.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {etapa.anotacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma anotação ainda.</p>
          ) : (
            <ul className="space-y-4">
              {etapa.anotacoes.map((anotacao) => (
                <li key={anotacao.id} className="space-y-2 rounded-lg border p-4">
                  {editandoId === anotacao.id ? (
                    <>
                      <Textarea
                        value={textoEdicao}
                        onChange={(event) => setTextoEdicao(event.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={salvando}
                          onClick={() => salvarEdicao(anotacao.id)}
                        >
                          <Check className="h-4 w-4" />
                          Salvar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditandoId(null); setTextoEdicao(""); }}
                        >
                          <X className="h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap">{anotacao.conteudo}</p>
                      <p className="text-xs text-muted-foreground">
                        Criado em {formatarData(anotacao.criadoEm)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditandoId(anotacao.id); setTextoEdicao(anotacao.conteudo); }}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setAnotacaoParaExcluir(anotacao.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={adicionarAnotacao} className="space-y-3 border-t pt-5">
            <Textarea
              placeholder="Escreva uma anotação..."
              value={novaAnotacao}
              onChange={(event) => setNovaAnotacao(event.target.value)}
            />
            <Button type="submit" disabled={salvando}>
              <Plus className="h-4 w-4" />
              Adicionar anotação
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog
        open={anotacaoParaExcluir !== null}
        onOpenChange={(aberto) => { if (!aberto) setAnotacaoParaExcluir(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir anotação?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A anotação será removida permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={salvando}
              onClick={() => setAnotacaoParaExcluir(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={salvando}
              onClick={excluirAnotacao}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
