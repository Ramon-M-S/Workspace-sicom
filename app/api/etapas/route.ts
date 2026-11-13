import { prisma } from "@/lib/prisma";
import { created, handleError, notFound, ok } from "@/lib/http";
import {
  criarEtapaSchema,
  listarEtapasQuerySchema,
} from "@/lib/validations/etapa";
import { getUsuarioLogado } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    const usuarioId = await getUsuarioLogado();
    if (!usuarioId) return new Response("Não autorizado.", { status: 401 });
    const query = listarEtapasQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries())
    );

    const etapas = await prisma.etapa.findMany({
      where: {
        usuarioId,
        ...(query.faseId ? { faseId: query.faseId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: [{ fase: { ordem: "asc" } }, { ordem: "asc" }],
      include: {
        fase: { select: { nome: true, ordem: true } },
        _count: { select: { anotacoes: true } },
      },
    });

    return ok(etapas);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const usuarioId = await getUsuarioLogado();
    if (!usuarioId) return new Response("Não autorizado.", { status: 401 });
    const data = criarEtapaSchema.parse(await request.json());
    const prefixoFase = `${usuarioId}:`;
    const faseId = data.faseId.startsWith(prefixoFase)
      ? data.faseId
      : `${prefixoFase}${data.faseId}`;
    const fase = await prisma.fase.findFirst({
      where: { id: faseId, usuarioId },
      select: { id: true },
    });

    if (!fase) return notFound("Fase não encontrada");

    const etapa = await prisma.etapa.create({ data: { ...data, faseId, usuarioId } });
    return created(etapa);
  } catch (err) {
    return handleError(err);
  }
}
