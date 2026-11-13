// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const usuario = await prisma.usuario.findUnique({
          where: { email: email.trim().toLowerCase() },
        });
        if (!usuario || !(await compare(password, usuario.senhaHash))) return null;

        return { id: usuario.id, name: usuario.nome, email: usuario.email };
      },
    }),
  ],
});