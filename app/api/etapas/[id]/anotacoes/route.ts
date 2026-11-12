import { created, handleError, notFound, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/log";
import { criarAnotacaoSchema } from "@/lib/validations/anotacao";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const etapa = await prisma.etapa.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!etapa) return notFound("Etapa não encontrada");

    const anotacoes = await prisma.anotacao.findMany({
      where: { etapaId: params.id },
      orderBy: { criadoEm: "desc" },
    });
    return ok(anotacoes);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const data = criarAnotacaoSchema.parse(await request.json());

    const etapa = await prisma.etapa.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!etapa) return notFound("Etapa não encontrada");

    const anotacao = await prisma.anotacao.create({
      data: { ...data, etapaId: params.id },
    });
    await registrarLog(params.id, "anotacao", null, null, "Anotação criada");
    return created(anotacao);
  } catch (err) {
    return handleError(err);
  }
}
