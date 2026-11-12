import {
  badRequest,
  handleError,
  noContent,
  notFound,
  ok,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/log";
import { atualizarEtapaSchema } from "@/lib/validations/etapa";

type RouteContext = { params: { id: string } };

function isRecordNotFound(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "P2025"
  );
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const etapa = await prisma.etapa.findUnique({
      where: { id: params.id },
      include: {
        fase: true,
        anotacoes: { orderBy: { criadoEm: "desc" } },
        lembretes: true,
      },
    });

    if (!etapa) return notFound();
    return ok(etapa);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const data = atualizarEtapaSchema.parse(await request.json());

    if (Object.keys(data).length === 0) {
      return badRequest("Nenhum campo para atualizar");
    }

    const existente = await prisma.etapa.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, progresso: true },
    });
    if (!existente) return notFound();

    if (data.faseId) {
      const fase = await prisma.fase.findUnique({
        where: { id: data.faseId },
        select: { id: true },
      });
      if (!fase) return notFound("Fase não encontrada");
    }

    const etapa = await prisma.etapa.update({
      where: { id: params.id },
      data,
    });

    if (data.status !== undefined && data.status !== existente.status) {
      await registrarLog(params.id, "status", "status", existente.status, data.status);
    }
    if (data.progresso !== undefined && data.progresso !== existente.progresso) {
      await registrarLog(
        params.id,
        "progresso",
        "progresso",
        String(existente.progresso),
        String(data.progresso),
      );
    }

    return ok(etapa);
  } catch (err) {
    if (isRecordNotFound(err)) return notFound();
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const existente = await prisma.etapa.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existente) return notFound();

    await prisma.etapa.delete({ where: { id: params.id } });
    return noContent();
  } catch (err) {
    if (isRecordNotFound(err)) return notFound();
    return handleError(err);
  }
}
