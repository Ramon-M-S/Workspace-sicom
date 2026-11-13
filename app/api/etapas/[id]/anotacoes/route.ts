import { created, handleError, notFound, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/log";
import { criarAnotacaoSchema } from "@/lib/validations/anotacao";
import { getUsuarioLogado } from "@/lib/auth-utils";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const usuarioId = await getUsuarioLogado();
    if (!usuarioId) return new Response("Não autorizado.", { status: 401 });
    const etapa = await prisma.etapa.findFirst({
      where: { id: params.id, usuarioId },
      select: { id: true },
    });
    if (!etapa) return notFound("Etapa não encontrada");

    const anotacoes = await prisma.anotacao.findMany({
      where: { etapaId: params.id, usuarioId },
      orderBy: { criadoEm: "desc" },
    });
    return ok(anotacoes);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const usuarioId = await getUsuarioLogado();
    if (!usuarioId) return new Response("Não autorizado.", { status: 401 });
    const data = criarAnotacaoSchema.parse(await request.json());

    const etapa = await prisma.etapa.findFirst({
      where: { id: params.id, usuarioId },
      select: { id: true },
    });
    if (!etapa) return notFound("Etapa não encontrada");

    const anotacao = await prisma.anotacao.create({
      data: { ...data, etapaId: params.id, usuarioId },
    });
    await registrarLog(params.id, "anotacao", null, null, "Anotação criada");
    return created(anotacao);
  } catch (err) {
    return handleError(err);
  }
}
