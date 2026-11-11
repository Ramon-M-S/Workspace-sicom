import { describe, expect, it } from "vitest";
import { calcularProximos } from "./lembretes";

const hoje = new Date("2026-11-11T12:00:00Z");

describe("calcularProximos", () => {
  it("marca como atrasado um lembrete cuja data alvo já passou", () => {
    const resultado = calcularProximos(
      [
        {
          id: "etapa-1",
          titulo: "Etapa de teste",
          fim: new Date("2026-11-14T12:00:00Z"),
          lembretes: [{ id: "lembrete-1", diasAntes: 7, canal: "email", enviado: false }],
        },
      ],
      hoje,
    );

    expect(resultado).toHaveLength(1);
    expect(resultado[0].lembretesHoje[0]).toMatchObject({
      dataAlvo: "2026-11-07T12:00:00.000Z",
      atrasado: true,
    });
  });

  it("inclui nos próximos um lembrete com data alvo futura", () => {
    const resultado = calcularProximos(
      [
        {
          id: "etapa-2",
          titulo: "Outra etapa",
          fim: new Date("2026-11-14T12:00:00Z"),
          lembretes: [{ id: "lembrete-2", diasAntes: 1, canal: "email", enviado: false }],
        },
      ],
      hoje,
    );

    expect(resultado).toHaveLength(1);
    expect(resultado[0].lembretesProximos[0]).toMatchObject({
      dataAlvo: "2026-11-13T12:00:00.000Z",
      atrasado: false,
    });
  });

  it("retorna array vazio quando não há lembrete na janela", () => {
    const resultado = calcularProximos(
      [
        {
          id: "etapa-3",
          titulo: "Etapa futura",
          fim: new Date("2026-11-30T12:00:00Z"),
          lembretes: [{ id: "lembrete-3", diasAntes: 1, canal: "email", enviado: false }],
        },
      ],
      hoje,
    );

    expect(resultado).toEqual([]);
  });
});
