import { handleError, notFound } from "@/lib/http";
import { gerarIcs } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth-utils";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const usuarioId = await getUsuarioLogado();
    if (!usuarioId) return new Response("Não autorizado.", { status: 401 });
    const etapa = await prisma.etapa.findFirst({
      where: { id: params.id, usuarioId },
      select: {
        id: true,
        titulo: true,
        objetivo: true,
        inicio: true,
        fim: true,
        entregaveis: true,
        dod: true,
      },
    });

    if (!etapa) return notFound();

    const ics = gerarIcs(etapa);
    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="etapa-${params.id}.ics"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
