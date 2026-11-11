import { NextResponse } from "next/server";
import { handleError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { atualizarConfiguracaoSchema } from "@/lib/validations/configuracao";

const CONFIGURACAO_ID = "singleton";

export async function GET() {
  try {
    const configuracao = await prisma.configuracao.upsert({
      where: { id: CONFIGURACAO_ID },
      create: { id: CONFIGURACAO_ID },
      update: {},
    });

    return NextResponse.json(configuracao);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body: unknown = await request.json();
    const data = atualizarConfiguracaoSchema.parse(body);
    const configuracao = await prisma.configuracao.upsert({
      where: { id: CONFIGURACAO_ID },
      create: { id: CONFIGURACAO_ID, ...data },
      update: data,
    });

    return NextResponse.json(configuracao);
  } catch (error) {
    return handleError(error);
  }
}
