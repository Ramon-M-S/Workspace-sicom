import { unlink } from "node:fs/promises";
import path from "node:path";
import { handleError, noContent, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/log";

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
    const anexo = await prisma.anexo.findUnique({ where: { id: params.id } });
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

    await prisma.anexo.delete({ where: { id: params.id } });
    await registrarLog(anexo.etapaId, "anexo", null, null, `Anexo excluído: ${anexo.nome}`);
    return noContent();
  } catch (err) {
    if (isRecordNotFound(err)) return notFound("Anexo não encontrado");
    return handleError(err);
  }
}
