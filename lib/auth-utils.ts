import { auth } from "@/auth";

export class UsuarioNaoAutenticadoError extends Error {
  constructor() {
    super("Usuário não autenticado.");
    this.name = "UsuarioNaoAutenticadoError";
  }
}

export async function getUsuarioLogado(): Promise<string> {
  const session = await auth();
  const usuarioId = session?.user?.id;
  if (!usuarioId) throw new UsuarioNaoAutenticadoError();
  return usuarioId;
}
