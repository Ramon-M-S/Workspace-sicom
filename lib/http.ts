import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UsuarioNaoAutenticadoError } from "@/lib/auth-utils";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function notFound(message = "Recurso não encontrado") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Erro interno") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function handleError(err: unknown) {
  if (err instanceof UsuarioNaoAutenticadoError) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Dados inválidos", details: err.flatten() },
      { status: 400 }
    );
  }
  console.error("[api] erro inesperado:", err);
  return serverError();
}
