import { prisma } from "../prisma";
import type { Prisma } from "../generated/prisma/client";
import {
  assertProjectPermission,
  type TccPermission,
} from "./authorization";

export async function assertTccProjectAccess(
  client: Prisma.TransactionClient | typeof prisma,
  projectId: string,
  userId: string,
  permission: TccPermission,
): Promise<void> {
  const membership = await client.membroProjetoTcc.findFirst({
    where: { projetoId: projectId, usuarioId: userId, ativo: true },
    select: { papel: true, ativo: true },
  });
  assertProjectPermission(membership, permission);
}

export async function authorizeTccProject(
  projectId: string,
  userId: string,
  permission: TccPermission,
): Promise<void> {
  return assertTccProjectAccess(prisma, projectId, userId, permission);
}
