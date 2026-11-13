// lib/auth.config.ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [], // Providers são adicionados no auth.ts
  callbacks: {
    // Callback para o Middleware proteger as rotas
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const rotasProtegidas = ["/dashboard", "/etapas", "/kanban", "/calendario", "/roadmap", "/configuracoes"];
      const isOnDashboard = rotasProtegidas.some(rota => nextUrl.pathname.startsWith(rota));
      const isOnAuthPage = nextUrl.pathname === "/login" || nextUrl.pathname === "/registro";

      if (isOnDashboard) {
       if (isLoggedIn) return true;
      return false; // Redireciona para /login
    } else if (isLoggedIn && isOnAuthPage) {
      return Response.redirect(new URL("/dashboard", nextUrl));
   }
   return true;
   },
    // Callbacks de JWT e Sessão (leves)
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") session.user.id = token.id;
      return session;
    },
  },
} satisfies NextAuthConfig;