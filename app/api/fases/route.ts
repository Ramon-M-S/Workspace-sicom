import { prisma } from "@/lib/prisma";
import { created, handleError } from "@/lib/http";
import { getUsuarioLogado } from "@/lib/auth-utils";
import { criarFaseSchema } from "@/lib/validations/fase";

export async function POST(request: Request) {
  try {
    const usuarioId = await getUsuarioLogado();
    const data = criarFaseSchema.parse(await request.json());
    const fase = await prisma.fase.create({
      data: {
        ...data,
        usuarioId,
        id: `${usuarioId}:fase-${crypto.randomUUID()}`,
      },
    });
    return created(fase);
  } catch (err) {
    return handleError(err);
  }
}
