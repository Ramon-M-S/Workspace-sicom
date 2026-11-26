"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Database, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Label } from "@/components/ui/label";

type Configuracao = {
  nomeProjeto: string;
  dataInicio: Date;
  dataDefesa: Date | null;
  emailLembrete: string | null;
  ativoLembretes: boolean;
  diasAntecedencia: number;
};

type Props = {
  configuracao: Configuracao;
  etapas: number;
  anotacoes: number;
};

function dataInput(data: Date | null) {
  return data ? new Date(data).toISOString().slice(0, 10) : "";
}

export function FormConfiguracoes({ configuracao, etapas, anotacoes }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("perfil");
  const [salvando, setSalvando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [nomeProjeto, setNomeProjeto] = useState(configuracao.nomeProjeto);
  const [dataInicio, setDataInicio] = useState(dataInput(configuracao.dataInicio));
  const [dataDefesa, setDataDefesa] = useState(dataInput(configuracao.dataDefesa));
  const [emailLembrete, setEmailLembrete] = useState(configuracao.emailLembrete ?? "");
  const [ativoLembretes, setAtivoLembretes] = useState(configuracao.ativoLembretes);
  const [diasAntecedencia, setDiasAntecedencia] = useState(String(configuracao.diasAntecedencia));
  const [erros, setErros] = useState<Record<string, string>>({});

  async function salvar(event: FormEvent<HTMLFormElement>, dados: Record<string, unknown>, sucesso: string) {
    event.preventDefault();
    setErros({});
    setSalvando(true);
    try {
      const resposta = await fetch("/api/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const resultado = await resposta.json();
      if (!resposta.ok) {
        const fieldErrors = resultado?.details?.fieldErrors;
        if (fieldErrors && typeof fieldErrors === "object") {
          setErros(Object.fromEntries(Object.entries(fieldErrors).map(([key, value]) => [key, Array.isArray(value) ? String(value[0] ?? "Revise este campo.") : "Revise este campo."])));
          if (Object.keys(fieldErrors).length > 0) {
            throw new Error("Revise os campos destacados e tente de novo.");
          }
        }
        throw new Error("Não conseguimos salvar as configurações. Tente de novo.");
      }
      toast.success(sucesso);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error && error.message.startsWith("Revise") ? error.message : "Não conseguimos salvar as configurações. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  async function restaurarDados() {
    setRestaurando(true);
    try {
      const resposta = await fetch("/api/configuracoes/seed", { method: "POST" });
      if (!resposta.ok) {
        throw new Error("Não conseguimos restaurar os dados. Tente de novo.");
      }
      setDialogAberto(false);
      toast.success("Perfil restaurado com sucesso.");
      router.refresh();
    } catch {
      toast.error("Não conseguimos restaurar os dados. Tente de novo.");
    } finally {
      setRestaurando(false);
    }
  }

  const conteudo = activeTab === "perfil" ? (
      <Card>
        <CardHeader>
          <CardTitle>Perfil do Projeto</CardTitle>
          <CardDescription>Informações básicas para organizar o cronograma do projeto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-5"
            onSubmit={(event) => salvar(event, {
              nomeProjeto,
              dataInicio,
              dataDefesa: dataDefesa || null,
            }, "Perfil do projeto salvo.")}
          >
            <div className="space-y-2">
              <Label htmlFor="nomeProjeto">Nome do Projeto</Label>
              <Input id="nomeProjeto" required minLength={3} value={nomeProjeto} onChange={(event) => setNomeProjeto(event.target.value)} aria-invalid={!!erros.nomeProjeto} aria-describedby={erros.nomeProjeto ? "nomeProjeto-erro" : undefined} />
              {erros.nomeProjeto && <p id="nomeProjeto-erro" role="alert" className="text-sm text-destructive">Informe um nome com pelo menos 3 caracteres.</p>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input id="dataInicio" type="date" required value={dataInicio} onChange={(event) => setDataInicio(event.target.value)} aria-invalid={!!erros.dataInicio} aria-describedby={erros.dataInicio ? "dataInicio-erro" : undefined} />
                {erros.dataInicio && <p id="dataInicio-erro" role="alert" className="text-sm text-destructive">Informe uma data de início válida.</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataDefesa">Data da Defesa</Label>
                <Input id="dataDefesa" type="date" value={dataDefesa} onChange={(event) => setDataDefesa(event.target.value)} aria-invalid={!!erros.dataDefesa} aria-describedby={erros.dataDefesa ? "dataDefesa-erro" : undefined} />
                {erros.dataDefesa && <p id="dataDefesa-erro" role="alert" className="text-sm text-destructive">Informe uma data de defesa válida.</p>}
              </div>
            </div>
            <Button type="submit" disabled={salvando}>
              <Save className="size-4" />
              {salvando ? "Salvando…" : "Salvar Perfil"}
            </Button>
          </form>
        </CardContent>
      </Card>
  ) : activeTab === "automacao" ? (
      <Card>
        <CardHeader>
          <CardTitle>Automação</CardTitle>
          <CardDescription>Defina como e quando os lembretes de prazo serão enviados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-5"
            onSubmit={(event) => salvar(event, {
              ativoLembretes,
              emailLembrete: emailLembrete.trim() || null,
              diasAntecedencia: Number(diasAntecedencia),
            }, "Preferências de automação salvas.")}
          >
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <span id="ativoLembretes-label" className="cursor-pointer text-sm font-medium">Ativar lembretes automáticos</span>
                <p className="text-sm text-muted-foreground">Permite o envio automático de e-mails sobre os prazos.</p>
              </div>
              <button
                id="ativoLembretes"
                type="button"
                role="switch"
                aria-checked={ativoLembretes}
                aria-labelledby="ativoLembretes-label"
                onClick={() => setAtivoLembretes((ativo) => !ativo)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${ativoLembretes ? "bg-primary" : "bg-muted-foreground/40"}`}
              >
                <span className={`absolute top-0.5 size-5 rounded-full bg-background shadow transition-transform ${ativoLembretes ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emailLembrete">E-mail para lembretes</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="emailLembrete" type="email" className="pl-9" placeholder="voce@exemplo.com" value={emailLembrete} onChange={(event) => setEmailLembrete(event.target.value)} aria-invalid={!!erros.emailLembrete} aria-describedby={erros.emailLembrete ? "emailLembrete-erro" : undefined} />
                </div>
                {erros.emailLembrete && <p id="emailLembrete-erro" role="alert" className="text-sm text-destructive">Informe um e-mail válido.</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasAntecedencia">Dias de antecedência</Label>
                <Input id="diasAntecedencia" type="number" min={1} max={30} required value={diasAntecedencia} onChange={(event) => setDiasAntecedencia(event.target.value)} aria-invalid={!!erros.diasAntecedencia} aria-describedby={erros.diasAntecedencia ? "diasAntecedencia-erro" : undefined} />
                {erros.diasAntecedencia && <p id="diasAntecedencia-erro" role="alert" className="text-sm text-destructive">Informe um número entre 1 e 30.</p>}
                <p className="text-xs text-muted-foreground">Você pode ajustar para 7, 3 ou 1 dia, por exemplo.</p>
              </div>
            </div>
            <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              O sistema enviará e-mails automaticamente para as etapas que estiverem a {diasAntecedencia || "X"} dias do prazo.
            </p>
            <Button type="submit" disabled={salvando}>
              <Save className="size-4" />
              {salvando ? "Salvando…" : "Salvar Automação"}
            </Button>
          </form>
        </CardContent>
      </Card>
  ) : (
    <Card>
      <CardHeader>
        <CardTitle>Dados do Projeto</CardTitle>
        <CardDescription>Resumo dos registros armazenados no sistema.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <Database className="size-5 text-muted-foreground" />
            <p className="font-medium">{etapas} {etapas === 1 ? "etapa" : "etapas"}</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <Database className="size-5 text-muted-foreground" />
            <p className="font-medium">{anotacoes} {anotacoes === 1 ? "anotação" : "anotações"}</p>
          </div>
        </div>
        <div className="space-y-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="flex-1 space-y-1">
              <h3 className="font-medium">Restaurar dados de fábrica</h3>
              <p className="text-sm text-muted-foreground">Esta ação remove os dados atuais e restaura a configuração inicial do sistema.</p>
            </div>
          </div>
          <div>
            <Button type="button" variant="destructive" onClick={() => setDialogAberto(true)}>
              Restaurar Dados de Fábrica
            </Button>
          </div>
        </div>
      </CardContent>
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar dados de fábrica?</DialogTitle>
            <DialogDescription>
              Isso apagará TODAS as suas etapas, anotações, anexos e configurações. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={restaurando} onClick={() => setDialogAberto(false)}>Cancelar</Button>
            <Button type="button" variant="destructive" disabled={restaurando} onClick={restaurarDados}>
              {restaurando ? "Restaurando…" : "Confirmar restauração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );

  const opcoes = [
    { id: "perfil", titulo: "Perfil do Projeto" },
    { id: "automacao", titulo: "Automação" },
    { id: "dados", titulo: "Dados" },
  ];

  return (
    <div className="flex w-full flex-col gap-6 md:flex-row">
      <nav aria-label="Seções de configurações" className="w-full md:w-64 shrink-0">
        <ul className="flex flex-col gap-1">
          {opcoes.map((opcao) => (
            <li key={opcao.id}>
              <button
                type="button"
                aria-current={activeTab === opcao.id ? "page" : undefined}
                onClick={() => setActiveTab(opcao.id)}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${activeTab === opcao.id ? "bg-muted text-foreground" : "bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
              >
                {opcao.titulo}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <section className="min-w-0 flex-1" aria-live="polite">
        <div className="w-full max-w-2xl">{conteudo}</div>
      </section>
    </div>
  );
}
