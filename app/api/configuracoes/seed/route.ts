import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executarSeed } from "@/prisma/seed";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ erro: "Restauração indisponível em produção." }, { status: 403 });
  }

  try {
    await prisma.$transaction([
      prisma.anotacao.deleteMany(),
      prisma.lembrete.deleteMany(),
      prisma.etapa.deleteMany(),
      prisma.fase.deleteMany(),
    ]);
    await executarSeed();

    return NextResponse.json({ mensagem: "Dados restaurados com sucesso!" });
  } catch (error) {
    console.error("[api] erro ao restaurar os dados:", error);
    return NextResponse.json({ erro: "Não foi possível restaurar os dados." }, { status: 500 });
  }
}
