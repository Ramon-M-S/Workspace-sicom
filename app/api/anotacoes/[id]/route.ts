import {
  badRequest,
  handleError,
  noContent,
  notFound,
  ok,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/log";
import { atualizarAnotacaoSchema } from "@/lib/validations/anotacao";
import { getUsuarioLogado } from "@/lib/auth-utils";

type RouteContext = { params: { id: string } };

function isRecordNotFound(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "P2025"
  );
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const usuarioId = await getUsuarioLogado();
    if (!usuarioId) return new Response("Não autorizado.", { status: 401 });
    const data = atualizarAnotacaoSchema.parse(await request.json());

    if (Object.keys(data).length === 0) {
      return badRequest("Nenhum campo para atualizar");
    }

    const existente = await prisma.anotacao.findFirst({
      where: { id: params.id, usuarioId },
      select: { etapaId: true },
    });
    if (!existente) return notFound();

    const anotacao = await prisma.anotacao.update({
      where: { id: params.id, usuarioId },
      data,
    });
    await registrarLog(existente.etapaId, "anotacao", null, null, "Anotação editada");
    return ok(anotacao);
  } catch (err) {
    if (isRecordNotFound(err)) return notFound();
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const usuarioId = await getUsuarioLogado();
    if (!usuarioId) return new Response("Não autorizado.", { status: 401 });
    const anotacao = await prisma.anotacao.findFirst({
      where: { id: params.id, usuarioId },
      select: { etapaId: true },
    });
    if (!anotacao) return notFound();

    await prisma.anotacao.delete({ where: { id: params.id, usuarioId } });
    await registrarLog(anotacao.etapaId, "anotacao", null, null, "Anotação excluída");
    return noContent();
  } catch (err) {
    if (isRecordNotFound(err)) return notFound();
    return handleError(err);
  }
}
