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
      <Icone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#52665F]" aria-hidden="true" />
      <Input
        id={id}
        {...props}
        className={`border-[#C8D1CA] bg-white pl-10 text-[#18352F] focus-visible:ring-[#164E45]/30 ${props.className ?? ""}`}
      />
    </div>
  );
}

export function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function criarConta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        throw new Error(resultado.erro ?? "Não foi possível criar a conta.");
      }

      toast.success("Conta criada! Faça login.");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-lg border-[#DDE8E0] bg-[#F5F7F2] text-[#18352F] shadow-xl">
      <CardHeader>
        <div className="mb-1 flex items-center gap-3">
          <span className="rounded-xl bg-[#164E45]/10 p-2">
            <User className="size-5 text-[#164E45]" aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-semibold text-[#164E45]">Prumo</span>
        </div>
        <CardTitle className="font-display text-3xl font-semibold text-[#164E45]">
          Criar conta
        </CardTitle>
        <CardDescription className="text-[#52665F]">
          Vamos preparar o caminho para o seu TCC.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={criarConta} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="registro-nome">Nome</Label>
            <CampoComIcone id="registro-nome" icone={User} name="nome" type="text" autoComplete="name" required maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="registro-email">E-mail</Label>
            <CampoComIcone id="registro-email" icone={Mail} name="email" type="email" autoComplete="email" required maxLength={254} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="registro-senha">Senha</Label>
            <CampoComIcone id="registro-senha" icone={LockKeyhole} name="senha" type="password" autoComplete="new-password" required minLength={8} maxLength={128} />
            <p className="text-xs text-[#52665F]">Use pelo menos 8 caracteres.</p>
          </div>
          <Button type="submit" className="w-full bg-[#164E45] text-[#F5F7F2] hover:bg-[#164E45]/90" disabled={enviando}>
            {enviando ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
        <p className="text-center text-sm text-[#52665F]">
          Já tem conta?{" "}
          <button type="button" onClick={onSwitch} className="font-semibold text-[#164E45] underline-offset-4 hover:underline">
            Faça login
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
