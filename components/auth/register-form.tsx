"use client";

import { useState, type ComponentProps, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LockKeyhole,
  Mail,
  User,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function CampoComIcone({
  id,
  icone: Icone,
  ...props
}: ComponentProps<typeof Input> & { id: string; icone: LucideIcon }) {
  return (
    <div className="relative">
      <Icone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        id={id}
        {...props}
        className={`border-border bg-card pl-10 text-foreground focus-visible:ring-ring ${props.className ?? ""}`}
      />
    </div>
  );
}

export function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  async function criarConta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErros({});
    setEnviando(true);

    const formData = new FormData(event.currentTarget);
    const dados = {
      nome: String(formData.get("nome") ?? ""),
      email: String(formData.get("email") ?? ""),
      senha: String(formData.get("senha") ?? ""),
    };

    try {
      const resposta = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const resultado = await resposta.json();

      if (!resposta.ok) {
        const detalhes = resultado?.detalhes;
        let possuiErrosDeCampo = false;
        if (detalhes && typeof detalhes === "object") {
          possuiErrosDeCampo = Object.keys(detalhes).length > 0;
          setErros(Object.fromEntries(Object.entries(detalhes).map(([key, value]) => [key, Array.isArray(value) ? String(value[0] ?? "Revise este campo.") : "Revise este campo."])));
        }
        throw new Error(possuiErrosDeCampo ? "Revise os campos destacados e tente de novo." : resultado.erro ?? "Não conseguimos criar a conta. Tente de novo.");
      }

      toast.success("Conta criada! Faça login.");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não conseguimos criar a conta. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-lg border-border bg-background text-foreground shadow-xl">
      <CardHeader>
        <div className="mb-1 flex items-center gap-3">
          <span className="rounded-xl bg-primary/10 p-2">
            <User className="size-5 text-primary" aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-semibold text-primary">Prumo</span>
        </div>
        <CardTitle className="font-display text-3xl font-semibold text-primary">
          Criar conta
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Vamos preparar o caminho para o seu TCC.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={criarConta} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="registro-nome">Nome</Label>
            <CampoComIcone id="registro-nome" icone={User} name="nome" type="text" autoComplete="name" required maxLength={120} aria-invalid={!!erros.nome} aria-describedby={erros.nome ? "registro-nome-erro" : undefined} />
            {erros.nome && <p id="registro-nome-erro" role="alert" className="text-sm text-destructive">Informe seu nome.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="registro-email">E-mail</Label>
            <CampoComIcone id="registro-email" icone={Mail} name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={!!erros.email} aria-describedby={erros.email ? "registro-email-erro" : undefined} />
            {erros.email && <p id="registro-email-erro" role="alert" className="text-sm text-destructive">Informe um e-mail válido.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="registro-senha">Senha</Label>
            <CampoComIcone id="registro-senha" icone={LockKeyhole} name="senha" type="password" autoComplete="new-password" required minLength={8} maxLength={128} aria-invalid={!!erros.senha} aria-describedby={erros.senha ? "registro-senha-erro" : undefined} />
            {erros.senha && <p id="registro-senha-erro" role="alert" className="text-sm text-destructive">Use pelo menos 8 caracteres.</p>}
            <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>
          </div>
          <Button type="submit" className="w-full bg-primary text-background hover:bg-primary/90" disabled={enviando}>
            {enviando ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <button type="button" onClick={onSwitch} className="font-semibold text-primary underline-offset-4 hover:underline">
            Faça login
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
