import {
  badRequest,
  handleError,
  noContent,
  notFound,
  ok,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { atualizarAnotacaoSchema } from "@/lib/validations/anotacao";

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
    const data = atualizarAnotacaoSchema.parse(await request.json());

    if (Object.keys(data).length === 0) {
      return badRequest("Nenhum campo para atualizar");
    }

    const anotacao = await prisma.anotacao.update({
      where: { id: params.id },
      data,
    });
    return ok(anotacao);
  } catch (err) {
    if (isRecordNotFound(err)) return notFound();
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await prisma.anotacao.delete({ where: { id: params.id } });
    return noContent();
  } catch (err) {
    if (isRecordNotFound(err)) return notFound();
    return handleError(err);
  }
}
