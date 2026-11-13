import { NextRequest } from "next/server";
import { calcularProximos } from "@/lib/lembretes";
import { handleError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const rawJanela = request.nextUrl.searchParams.get("janela");
  const parsedJanela = rawJanela === null ? 7 : Number.parseInt(rawJanela, 10);
  const janela = Number.isFinite(parsedJanela)
    ? Math.min(30, Math.max(1, parsedJanela))
    : 7;
  const hoje = new Date();
  const limiteAtrasadas = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const usuarioId = await getUsuarioLogado();
    if (!usuarioId) return new Response("Não autorizado.", { status: 401 });
    const etapas = await prisma.etapa.findMany({
      where: { usuarioId, fim: { gte: limiteAtrasadas } },
      select: {
        id: true,
        titulo: true,
        fim: true,
        lembretes: {
          select: { id: true, diasAntes: true, canal: true, enviado: true },
        },
      },
    });

    return ok({
      hoje: new Date().toISOString(),
      janela,
      etapas: calcularProximos(etapas, hoje, janela),
    });
  } catch (error) {
    return handleError(error);
  }
}
