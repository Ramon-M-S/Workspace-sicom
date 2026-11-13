import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { badRequest, created, handleError, notFound, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/log";
import { getUsuarioLogado } from "@/lib/auth-utils";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const usuarioId = await getUsuarioLogado();
    if (!usuarioId) return new Response("Não autorizado.", { status: 401 });
    const etapa = await prisma.etapa.findFirst({
      where: { id: params.id, usuarioId },
      select: { id: true },
    });
    if (!etapa) return notFound("Etapa não encontrada");

    const anexos = await prisma.anexo.findMany({
      where: { etapaId: params.id, usuarioId },
      orderBy: { criadoEm: "desc" },
    });
    return ok(anexos);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const usuarioId = await getUsuarioLogado();
    if (!usuarioId) return new Response("Não autorizado.", { status: 401 });
    const etapa = await prisma.etapa.findFirst({
      where: { id: params.id, usuarioId },
      select: { id: true },
    });
    if (!etapa) return notFound("Etapa não encontrada");

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return badRequest("Arquivo não informado");
    if (file.size === 0) return badRequest("O arquivo está vazio");
    if (file.size > MAX_FILE_SIZE) return badRequest("O tamanho máximo do arquivo é 5 MB");
    if (!ALLOWED_TYPES.has(file.type)) {
      return badRequest("Tipo de arquivo não permitido. Envie PDF, PNG ou JPG.");
    }

    const extensaoPorTipo: Record<string, string> = {
      "application/pdf": ".pdf",
      "image/png": ".png",
      "image/jpeg": ".jpg",
    };
    const nomeUnico = `${Date.now()}-${randomUUID()}${extensaoPorTipo[file.type]}`;
    const caminho = path.join(UPLOADS_DIR, nomeUnico);
    await mkdir(UPLOADS_DIR, { recursive: true });

    let anexo;
    try {
      await writeFile(caminho, Buffer.from(await file.arrayBuffer()), { flag: "wx" });
      anexo = await prisma.anexo.create({
        data: {
          etapaId: params.id,
          usuarioId,
          nome: file.name,
          url: `/uploads/${nomeUnico}`,
          tipo: file.type,
          tamanho: file.size,
        },
      });
    } catch (err) {
      await unlink(caminho).catch(() => undefined);
      throw err;
    }

    await registrarLog(params.id, "anexo", null, null, `Anexo enviado: ${file.name}`);
    return created(anexo);
  } catch (err) {
    return handleError(err);
  }
}
