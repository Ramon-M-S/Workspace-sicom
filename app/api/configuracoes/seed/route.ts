import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executarSeed } from "@/prisma/seed-logic";
import {
  getUsuarioLogado,
  UsuarioNaoAutenticadoError,
} from "@/lib/auth-utils";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ erro: "Restauração indisponível em produção." }, { status: 403 });
  }

  try {
    const usuarioId = await getUsuarioLogado();

    await prisma.$transaction(async (tx) => {
      await tx.logAlteracao.deleteMany({ where: { usuarioId } });
      await tx.anexo.deleteMany({ where: { usuarioId } });
      await tx.anotacao.deleteMany({ where: { usuarioId } });
      await tx.lembrete.deleteMany({ where: { etapa: { usuarioId } } });
      await tx.etapa.deleteMany({ where: { usuarioId } });
      await tx.fase.deleteMany({ where: { usuarioId } });
      await tx.configuracao.deleteMany({ where: { usuarioId } });
    });
    await executarSeed(usuarioId, true);

    return NextResponse.json({
      mensagem: "Seu perfil foi completamente resetado para os padrões de fábrica.",
    });
  } catch (error) {
    if (error instanceof UsuarioNaoAutenticadoError) {
      return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
    }
    console.error("[api] erro ao restaurar os dados:", error);
    return NextResponse.json({ erro: "Não foi possível restaurar os dados." }, { status: 500 });
  }
}
