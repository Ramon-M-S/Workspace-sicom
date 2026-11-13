import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { executarSeed } from "@/prisma/seed-logic";

const schemaRegistro = z.object({
  nome: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  senha: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  const validacao = schemaRegistro.safeParse(body);
  if (!validacao.success) {
    return NextResponse.json({ erro: "Dados inválidos.", detalhes: validacao.error.flatten().fieldErrors }, { status: 400 });
  }

  const nome = validacao.data.nome;
  const email = validacao.data.email.toLowerCase();
  const existente = await prisma.usuario.findUnique({ where: { email }, select: { id: true } });
  if (existente) {
    return NextResponse.json({ erro: "Este e-mail já está cadastrado." }, { status: 409 });
  }

  let usuarioCriadoId: string | null = null;
  try {
    const usuario = await prisma.usuario.create({
      data: { nome, email, senhaHash: await hash(validacao.data.senha, 12) },
      select: { id: true, nome: true, email: true, criadoEm: true },
    });
    usuarioCriadoId = usuario.id;
    await executarSeed(usuario.id, true);
    return NextResponse.json({ usuario }, { status: 201 });
  } catch (error) {
    if (usuarioCriadoId) {
      await prisma.usuario.delete({ where: { id: usuarioCriadoId } }).catch(() => undefined);
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ erro: "Este e-mail já está cadastrado." }, { status: 409 });
    }
    console.error("[api] erro ao registrar usuário:", error);
    return NextResponse.json({ erro: "Não foi possível criar a conta." }, { status: 500 });
  }
}
