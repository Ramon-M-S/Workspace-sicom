import { describe, expect, it } from "vitest";
import { PapelMembroProjetoTcc } from "../generated/prisma/enums";
import {
  assertProjectPermission,
  getProjectAccessDecision,
  isTccModelManagerId,
  TccProjectAccessError,
  type TccPermission,
} from "./authorization";

const permissions: TccPermission[] = [
  "READ_PROJECT",
  "EDIT_PROJECT",
  "MANAGE_MEMBERS",
  "EDIT_SECTIONS",
  "COMMENT",
  "EXPORT",
];

describe("autorização de projetos TCC", () => {
  it("aplica permissões por papel a membros ativos", () => {
    const expected: Record<string, TccPermission[]> = {
      PROPRIETARIO: permissions,
      COAUTOR_EDITOR: ["READ_PROJECT", "EDIT_SECTIONS", "COMMENT", "EXPORT"],
      ORIENTADOR: ["READ_PROJECT", "COMMENT", "EXPORT"],
      REVISOR: ["READ_PROJECT", "COMMENT", "EXPORT"],
    };
    const roles = [
      PapelMembroProjetoTcc.PROPRIETARIO,
      PapelMembroProjetoTcc.COAUTOR_EDITOR,
      PapelMembroProjetoTcc.ORIENTADOR,
      PapelMembroProjetoTcc.REVISOR,
    ];

    for (const papel of roles) {
      for (const permission of permissions) {
        expect(
          getProjectAccessDecision({ papel, ativo: true }, permission),
        ).toBe(expected[papel].includes(permission) ? "AUTHORIZED" : "FORBIDDEN");
      }
    }
  });

  it("oculta ausência ou inatividade da associação como recurso inexistente", () => {
    expect(getProjectAccessDecision(null, "READ_PROJECT")).toBe("NOT_FOUND");
    expect(
      getProjectAccessDecision(
        { papel: PapelMembroProjetoTcc.PROPRIETARIO, ativo: false },
        "READ_PROJECT",
      ),
    ).toBe("NOT_FOUND");
    expect(() => assertProjectPermission(null, "READ_PROJECT")).toThrow(
      TccProjectAccessError,
    );
  });

  it("nega gestão de modelos por padrão e aceita apenas IDs explicitamente permitidos", () => {
    expect(isTccModelManagerId("user-a", undefined)).toBe(false);
    expect(isTccModelManagerId("user-a", " user-a, user-b ")).toBe(true);
    expect(isTccModelManagerId("user-c", "user-a,user-b")).toBe(false);
  });
});
