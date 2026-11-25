"use client";

import { useState } from "react";
import { ArrowRight, Compass } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";

export function AuthContainer({
  initialMode = "login",
}: {
  initialMode?: "login" | "register";
}) {
  const [isLogin, setIsLogin] = useState(initialMode === "login");

  return (
    <main className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#164E45] p-4">
      <div className="relative flex h-[600px] max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-[#F5F7F2] shadow-2xl">
        <div
          className={`absolute inset-y-0 left-0 z-0 w-full transition-transform duration-700 ease-in-out lg:w-1/2 ${
            isLogin ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-hidden={!isLogin}
          inert={!isLogin}
        >
          <div className="flex h-full items-center justify-center px-4 py-6 sm:px-8">
            <LoginForm onSwitch={() => setIsLogin(false)} />
          </div>
        </div>

        <div
          className={`absolute inset-y-0 right-0 z-0 w-full transition-transform duration-700 ease-in-out lg:w-1/2 ${
            isLogin ? "translate-x-full" : "translate-x-0"
          }`}
          aria-hidden={isLogin}
          inert={isLogin}
        >
          <div className="flex h-full items-center justify-center px-4 py-5 sm:px-8">
            <RegisterForm onSwitch={() => setIsLogin(true)} />
          </div>
        </div>

        <div
          className={`absolute inset-y-0 left-1/2 z-10 hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-[#164E45] p-10 text-center text-[#F5F7F2] transition-transform duration-700 ease-in-out lg:flex xl:p-12 ${
            isLogin ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute -right-20 -top-20 size-64 rounded-full border border-[#F5F7F2]/10" />
          <div className="absolute -bottom-24 -left-16 size-72 rounded-full bg-[#D9A84E]/10 blur-2xl" />
          <div className="relative z-10 flex max-w-sm flex-col items-center">
            <div className="mb-8 rounded-2xl border border-[#F5F7F2]/15 bg-[#F5F7F2]/5 p-4">
              <Compass className="size-9 text-[#D9A84E]" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h2 className="font-display text-4xl font-semibold leading-tight">
              {isLogin ? "Seu TCC tem um caminho." : "Que bom ter você de volta."}
            </h2>
            <p className="mt-4 leading-relaxed text-[#F5F7F2]/80">
              {isLogin
                ? "Organize as etapas, encontre o próximo passo e avance no seu ritmo."
                : "A clareza do próximo passo continua aqui. Vamos retomar de onde você parou."}
            </p>
            <button
              type="button"
              onClick={() => setIsLogin((atual) => !atual)}
              className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#F5F7F2]/70 px-7 text-sm font-semibold transition-colors hover:bg-[#F5F7F2] hover:text-[#164E45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A84E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#164E45]"
            >
              {isLogin ? "Criar conta" : "Entrar na minha conta"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            <p className="mt-8 text-xs text-[#F5F7F2]/60">
              Respire. Um passo de cada vez.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
