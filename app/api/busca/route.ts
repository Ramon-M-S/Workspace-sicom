import { handleError, ok } from "@/lib/http";
import { buscarGlobal } from "@/lib/queries/busca";
import { getUsuarioLogado } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    const usuarioId = await getUsuarioLogado();
    const termo = new URL(request.url).searchParams.get("q") ?? "";
    const resultado = await buscarGlobal(termo, usuarioId);
    return ok(resultado);
  } catch (error) {
    return handleError(error);
  }
}
