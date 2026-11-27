import { describe, expect, it } from "vitest";
import {
  createProjectInputSchema,
  replaceMembersInputSchema,
  updateDraftVersionSchema,
} from "./api-schemas";

describe("validação de entradas da API TCC", () => {
  it("rejeita campos extra e estruturas com acessores em payloads de projeto", () => {
    const getterPayload = Object.defineProperty(
      {
        versaoModeloId: "version-a",
        titulo: "Projeto",
      },
      "autores",
      {
        enumerable: true,
        get() {
          throw new Error("getter não deve executar");
        },
      },
    );

    expect(createProjectInputSchema.safeParse(getterPayload).success).toBe(false);
    expect(
      createProjectInputSchema.safeParse({
        versaoModeloId: "version-a",
        titulo: "Projeto",
        snapshotModeloJson: {},
      }).success,
    ).toBe(false);
  });

  it("barra chaves perigosas antes de encaminhar alterações de versão", () => {
    const unsafe = JSON.parse(
      '{"changes":{"__proto__":{"polluted":true}}}',
    ) as unknown;
    expect(updateDraftVersionSchema.safeParse(unsafe).success).toBe(false);
  });

  it("exige ao menos um proprietário e impede membros duplicados", () => {
    expect(
      replaceMembersInputSchema.safeParse({
        membros: [{ usuarioId: "user-a", papel: "REVISOR" }],
      }).success,
    ).toBe(false);
    expect(
      replaceMembersInputSchema.safeParse({
        membros: [
          { usuarioId: "owner", papel: "PROPRIETARIO" },
          { usuarioId: "owner", papel: "REVISOR" },
        ],
      }).success,
    ).toBe(false);
  });
});
