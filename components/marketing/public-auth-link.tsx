"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function PublicAuthLink({ className }: { className?: string }) {
  const { data: session, status } = useSession();
  const href = session ? "/dashboard" : "/login";
  const label = status === "loading" ? "Entrar" : session ? "Ir para o Dashboard" : "Entrar";

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
