import type { PapelMembroProjetoTcc } from "../generated/prisma/enums";

export type TccPermission =
  | "READ_PROJECT"
  | "EDIT_PROJECT"
  | "MANAGE_MEMBERS"
  | "EDIT_SECTIONS"
  | "COMMENT"
  | "EXPORT";

export interface TccProjectMembership {
  papel: PapelMembroProjetoTcc;
  ativo: boolean;
}

export type ProjectAccessDecision = "AUTHORIZED" | "NOT_FOUND" | "FORBIDDEN";

const PERMISSIONS_BY_ROLE: Record<
  PapelMembroProjetoTcc,
  ReadonlySet<TccPermission>
> = {
  PROPRIETARIO: new Set<TccPermission>([
    "READ_PROJECT",
    "EDIT_PROJECT",
    "MANAGE_MEMBERS",
    "EDIT_SECTIONS",
    "COMMENT",
    "EXPORT",
  ]),
  COAUTOR_EDITOR: new Set<TccPermission>([
    "READ_PROJECT",
    "EDIT_SECTIONS",
    "COMMENT",
    "EXPORT",
  ]),
  ORIENTADOR: new Set<TccPermission>(["READ_PROJECT", "COMMENT", "EXPORT"]),
  REVISOR: new Set<TccPermission>(["READ_PROJECT", "COMMENT", "EXPORT"]),
};

export class TccProjectAccessError extends Error {
  constructor(readonly status: 403 | 404) {
    super(
      status === 404
        ? "Projeto não encontrado."
        : "Você não tem permissão para esta operação.",
    );
    this.name = "TccProjectAccessError";
  }
}

export function isTccModelManagerId(
  userId: string,
  configuredIds: string | undefined,
): boolean {
  return new Set(
    (configuredIds ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  ).has(userId);
}

export function getProjectAccessDecision(
  membership: TccProjectMembership | null | undefined,
  permission: TccPermission,
): ProjectAccessDecision {
  if (!membership || !membership.ativo) return "NOT_FOUND";
  return PERMISSIONS_BY_ROLE[membership.papel].has(permission)
    ? "AUTHORIZED"
    : "FORBIDDEN";
}

export function assertProjectPermission(
  membership: TccProjectMembership | null | undefined,
  permission: TccPermission,
): asserts membership is TccProjectMembership {
  const decision = getProjectAccessDecision(membership, permission);
  if (decision === "NOT_FOUND") throw new TccProjectAccessError(404);
  if (decision === "FORBIDDEN") throw new TccProjectAccessError(403);
}
