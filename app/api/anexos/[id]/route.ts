import { unlink } from "node:fs/promises";
import path from "node:path";
import { handleError, noContent, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/log";
import { getUsuarioLogado } from "@/lib/auth-utils";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

function isRecordNotFound(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "P2025"
  );
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const usuarioId = await getUsuarioLogado();
    if (!usuarioId) return new Response("Não autorizado.", { status: 401 });
    const anexo = await prisma.anexo.findFirst({ where: { id: params.id, usuarioId } });
    if (!anexo) return notFound("Anexo não encontrado");

    const nomeArquivo = path.basename(anexo.url);
    const caminho = path.join(process.cwd(), "public", "uploads", nomeArquivo);
    try {
      await unlink(caminho);
    } catch (err) {
      if (!(typeof err === "object" && err !== null && "code" in err && err.code === "ENOENT")) {
        throw err;
      }
    }

    await prisma.anexo.delete({ where: { id: params.id, usuarioId } });
    await registrarLog(anexo.etapaId, "anexo", null, null, `Anexo excluído: ${anexo.nome}`);
    return noContent();
  } catch (err) {
    if (isRecordNotFound(err)) return notFound("Anexo não encontrado");
    return handleError(err);
  }
}
