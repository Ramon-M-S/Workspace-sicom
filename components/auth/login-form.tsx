"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { LockKeyhole, Mail } from "lucide-react";
import { Logo } from "@/components/layout/logo";
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

export function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [erro, setErro] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(false);
    setEnviando(true);
    const dados = new FormData(event.currentTarget);

    try {
      const resultado = await signIn("credentials", {
        email: dados.get("email"),
        password: dados.get("password"),
        redirectTo: "/dashboard",
        redirect: false,
      });
      if (resultado?.error) {
        setErro(true);
        setEnviando(false);
        return;
      }
      window.location.assign(resultado?.url ?? "/dashboard");
    } catch {
      setErro(true);
      setEnviando(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md border-border bg-background text-foreground shadow-xl">
      <CardHeader>
        <div className="mb-1 flex items-center gap-3">
          <Logo size={40} decorative />
          <span className="font-display text-xl font-semibold text-primary">Prumo</span>
        </div>
        <CardTitle className="font-display text-3xl font-semibold text-primary">
          Entrar no Prumo
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Acesse sua conta para continuar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={entrar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">E-mail</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-invalid={erro}
                aria-describedby={erro ? "login-erro" : undefined}
                className="border-border bg-card pl-10 text-foreground focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Senha</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-invalid={erro}
                aria-describedby={erro ? "login-erro" : undefined}
                className="border-border bg-card pl-10 text-foreground focus-visible:ring-ring"
              />
            </div>
          </div>
          {erro && (
            <p id="login-erro" role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Não conseguimos entrar. Confira seu e-mail e senha e tente de novo.
            </p>
          )}
          <Button type="submit" disabled={enviando} className="w-full bg-primary text-background hover:bg-primary/90">
            {enviando ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            Não tem conta?{" "}
            <button type="button" onClick={onSwitch} className="font-semibold text-primary underline-offset-4 hover:underline">
              Cadastre-se
            </button>
          </p>
          <Link href="/brandbook" className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
            Guia de Marca do Prumo
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
