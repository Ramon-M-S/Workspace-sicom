"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

export default function RegistroPage() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [dataInicio, setDataInicio] = useState("");

  useEffect(() => {
    const hoje = new Date();
    hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
    setDataInicio(hoje.toISOString().slice(0, 10));
  }, []);

  async function criarConta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnviando(true);

    const formData = new FormData(event.currentTarget);
    const dados = {
      nome: String(formData.get("nome") ?? ""),
      email: String(formData.get("email") ?? ""),
      senha: String(formData.get("senha") ?? ""),
      nomeProjeto: String(formData.get("nomeProjeto") ?? ""),
      dataInicio: String(formData.get("dataInicio") ?? ""),
      dataDefesa: String(formData.get("dataDefesa") ?? ""),
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Criar conta no Prumo</CardTitle>
          <CardDescription>Cadastre seus dados para começar a organizar seu projeto.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={criarConta} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" type="text" autoComplete="name" required maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" name="senha" type="password" autoComplete="new-password" required minLength={8} maxLength={128} />
              <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomeProjeto">Nome do seu TCC</Label>
              <Input
                id="nomeProjeto"
                name="nomeProjeto"
                type="text"
                placeholder="Ex: Sistema para Guarda Municipal"
                minLength={3}
                maxLength={120}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input
                  id="dataInicio"
                  name="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(event) => setDataInicio(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataDefesa">Data da Defesa (Opcional)</Label>
                <Input id="dataDefesa" name="dataDefesa" type="date" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Faça login
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
