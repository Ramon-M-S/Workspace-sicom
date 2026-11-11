import { handleError, ok } from "@/lib/http";
import { buscarGlobal } from "@/lib/queries/busca";

export async function GET(request: Request) {
  try {
    const termo = new URL(request.url).searchParams.get("q") ?? "";
    const resultado = await buscarGlobal(termo);
    return ok(resultado);
  } catch (error) {
    return handleError(error);
  }
}
