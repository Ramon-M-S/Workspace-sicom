import { prisma } from "@/lib/prisma";
import { created, handleError, notFound, ok } from "@/lib/http";
import {
  criarEtapaSchema,
  listarEtapasQuerySchema,
} from "@/lib/validations/etapa";

export async function GET(request: Request) {
  try {
    const query = listarEtapasQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries())
    );

    const etapas = await prisma.etapa.findMany({
      where: {
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
    const data = criarEtapaSchema.parse(await request.json());
    const fase = await prisma.fase.findUnique({
      where: { id: data.faseId },
      select: { id: true },
    });

    if (!fase) return notFound("Fase não encontrada");

    const etapa = await prisma.etapa.create({ data });
    return created(etapa);
  } catch (err) {
    return handleError(err);
  }
}
