import { NextResponse } from "next/server";
import { handleError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { atualizarConfiguracaoSchema } from "@/lib/validations/configuracao";
import { getUsuarioLogado } from "@/lib/auth-utils";

export async function GET() {
  try {
    const usuarioId = await getUsuarioLogado();
    const configuracao = await prisma.configuracao.upsert({
      where: { usuarioId },
      create: { usuarioId },
      update: {},
    });

    return NextResponse.json(configuracao);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const usuarioId = await getUsuarioLogado();
    const body: unknown = await request.json();
    const data = atualizarConfiguracaoSchema.parse(body);
    const configuracao = await prisma.configuracao.upsert({
      where: { usuarioId },
      create: { usuarioId, ...data },
      update: data,
    });

    return NextResponse.json(configuracao);
  } catch (error) {
    return handleError(error);
  }
}
