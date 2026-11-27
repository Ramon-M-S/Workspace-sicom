import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UsuarioNaoAutenticadoError, getUsuarioLogado } from "../auth-utils";
import { Prisma } from "../generated/prisma/client";
import {
  isTccModelManagerId,
  TccProjectAccessError,
} from "./authorization";
import { ModelDefinitionSemanticError } from "./semantic-validation";
import { TccApiError } from "./errors";

export function parseResourceId(value: string): string {
  if (value.length < 1 || value.length > 128) {
    throw new TccApiError(404, "Recurso não encontrado.");
  }
  return value;
}

export function isTccModelManager(userId: string): boolean {
  return isTccModelManagerId(userId, process.env.TCC_MODEL_MANAGER_IDS);
}

export function requireTccModelManager(userId: string): void {
  if (!isTccModelManager(userId)) {
    throw new TccApiError(403, "Você não tem permissão para gerir modelos.");
  }
}

export { authorizeTccProject } from "./project-access";
export { TccApiError } from "./errors";

function isPrismaError(
  error: unknown,
): error is { code: string; meta?: { target?: unknown } } {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function tccErrorResponse(error: unknown): NextResponse {
  if (
    error instanceof UsuarioNaoAutenticadoError ||
    (error instanceof Error && error.name === "UnauthorizedError")
  ) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (error instanceof TccApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  if (error instanceof TccProjectAccessError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: error.flatten() },
      { status: 400 },
    );
  }
  if (error instanceof ModelDefinitionSemanticError) {
    return NextResponse.json(
      { error: "Definição do modelo inválida.", details: error.issues },
      { status: 400 },
    );
  }
  if (isPrismaError(error)) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "O recurso conflita com um registro existente." },
        { status: 409 },
      );
    }
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Uma das referências informadas não é válida." },
        { status: 400 },
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Recurso não encontrado." }, { status: 404 });
    }
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  console.error("[api:tcc] erro inesperado:", error);
  return NextResponse.json({ error: "Erro interno." }, { status: 500 });
}

export async function runTccApi(
  handler: (userId: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const userId = await getUsuarioLogado();
    return await handler(userId);
  } catch (error) {
    return tccErrorResponse(error);
  }
}
