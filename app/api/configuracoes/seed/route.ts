import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executarSeed } from "@/prisma/seed-logic";
import { getUsuarioLogado } from "@/lib/auth-utils";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ erro: "Restauração indisponível em produção." }, { status: 403 });
  }

  const usuarioId = await getUsuarioLogado().catch(() => null);
  if (!usuarioId) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  try {
    await prisma.$transaction([
      prisma.anotacao.deleteMany({ where: { usuarioId } }),
      prisma.lembrete.deleteMany({ where: { etapa: { usuarioId } } }),
      prisma.etapa.deleteMany({ where: { usuarioId } }),
      prisma.fase.deleteMany({ where: { usuarioId } }),
    ]);
    await executarSeed(usuarioId);

    return NextResponse.json({ mensagem: "Dados restaurados com sucesso!" });
  } catch (error) {
    console.error("[api] erro ao restaurar os dados:", error);
    return NextResponse.json({ erro: "Não foi possível restaurar os dados." }, { status: 500 });
  }
}
