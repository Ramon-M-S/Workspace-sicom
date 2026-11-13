"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={entrar} className="w-full max-w-sm space-y-5 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Entrar no SICOM</h1>
          <p className="text-sm text-muted-foreground">Acesse sua conta para continuar.</p>
        </div>
        <label className="block space-y-2 text-sm font-medium">
          E-mail
          <input name="email" type="email" autoComplete="email" required className="w-full rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          Senha
          <input name="password" type="password" autoComplete="current-password" required className="w-full rounded-md border bg-background px-3 py-2 font-normal" />
        </label>
        {erro && <p role="alert" className="text-sm text-destructive">Credenciais inválidas</p>}
        <button type="submit" disabled={enviando} className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60">
          {enviando ? "Entrando..." : "Entrar"}
        </button>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/registro" className="font-medium text-primary hover:underline">
            Cadastre-se
          </Link>
        </div>
      </form>
    </main>
  );
}
