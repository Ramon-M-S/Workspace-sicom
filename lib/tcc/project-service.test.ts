import { describe, expect, it } from "vitest";
import {
  institutionalModelDefinitionSchema,
  type InstitutionalModelDefinition,
} from "./model-definition.schema";
import {
  buildSectionTree,
  buildInitialSectionRecords,
  buildProjectPeople,
} from "./project-service";
import { createProjectModelSnapshot, updateDraftVersion } from "./versioning";

function createDefinition(): InstitutionalModelDefinition {
  return institutionalModelDefinitionSchema.parse({
    schemaVersion: 1,
    modelId: "modelo-projeto",
    name: "Modelo configurável",
    version: 1,
    status: "PUBLICADA",
    formatting: {
      page: { size: "custom", orientation: "portrait" },
      marginsMm: { top: 10, right: 10, bottom: 10, left: 10 },
      typography: {
        fontFamily: "Sans",
        bodySizePt: 11,
        lineHeight: 1.4,
        sizes: {},
      },
      alignment: "left",
      spacing: {},
      numbering: { enabled: false, style: "none", startAt: 1 },
      pagination: {
        enabled: false,
        position: "bottom",
        includeFirstPage: false,
      },
      styles: {},
    },
    sections: [
      {
        key: "later",
        title: "Depois",
        category: "conteudo",
        mode: "manual",
        required: false,
        numbered: false,
        order: 2,
        subsections: [],
      },
      {
        key: "first",
        title: "Primeira",
        category: "conteudo",
        mode: "hybrid",
        required: true,
        numbered: true,
        order: 1,
        subsections: [
          {
            key: "child",
            title: "Subseção",
            category: "conteudo",
            mode: "automatic",
            required: false,
            numbered: false,
            order: 1,
            subsections: [],
          },
        ],
      },
    ],
    automaticElements: [],
  });
}

describe("inicialização de projetos TCC", () => {
  it("gera seções hierárquicas em ordem estável e aplica cronograma opcional", () => {
    const definition = createDefinition();
    const records = buildInitialSectionRecords(
      definition,
      [
        {
          chave: "child",
          dataInicioPrevista: "2026-01-01T00:00:00.000Z",
          dataEntregaPrevista: "2026-02-01T00:00:00.000Z",
        },
      ],
      () => "doc-id",
    );

    expect(records.map(({ chave }) => chave)).toEqual([
      "first",
      "child",
      "later",
    ]);
    expect(records[1].secaoPaiChave).toBe("first");
    expect(records[1].modo).toBe("AUTOMATICO");
    expect(records[1].conteudoJson).toEqual({
      schemaVersion: 1,
      documentId: "doc-id",
      title: "Subseção",
      blocks: [],
    });
    expect(records[1].dataEntregaPrevista?.toISOString()).toBe(
      "2026-02-01T00:00:00.000Z",
    );
    expect(records[2].dataInicioPrevista).toBeNull();
  });

  it("não mistura autores acadêmicos com membros e registra separadamente o proprietário", () => {
    const people = buildProjectPeople(
      "user-owner",
      [{ nome: "Autora sem conta", email: null }],
      [{ usuarioId: "user-advisor", papel: "ORIENTADOR" }],
    );

    expect(people.autores).toEqual([
      { nome: "Autora sem conta", email: null, ordem: 1 },
    ]);
    expect(people.membros).toEqual([
      { usuarioId: "user-owner", papel: "PROPRIETARIO", ativo: true },
      { usuarioId: "user-advisor", papel: "ORIENTADOR", ativo: true },
    ]);
    expect(people.autores).not.toContainEqual(
      expect.objectContaining({ usuarioId: "user-advisor" }),
    );
  });

  it("mantém o snapshot independente e impede atualizar uma definição publicada", () => {
    const source = createDefinition();
    const snapshot = createProjectModelSnapshot(source);
    source.sections[0].title = "Mutação externa";

    expect(snapshot.sections[0].title).toBe("Depois");
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.sections)).toBe(true);
    expect(() =>
      updateDraftVersion(createDefinition(), { name: "Alteração" }),
    ).toThrow(/imutáveis/);
  });

  it("monta a árvore persistida ordenando cada nível e preservando empates", () => {
    const tree = buildSectionTree([
      { id: "child", secaoPaiId: "root-a", ordem: 1 },
      { id: "root-b", secaoPaiId: null, ordem: 2 },
      { id: "root-a", secaoPaiId: null, ordem: 1 },
      { id: "child-tie", secaoPaiId: "root-a", ordem: 1 },
    ]);

    expect(tree.map(({ id }) => id)).toEqual(["root-a", "root-b"]);
    expect(tree[0].subsecoes.map(({ id }) => id)).toEqual([
      "child",
      "child-tie",
    ]);
  });

  it("rejeita cronograma de seção que não pertence ao modelo", () => {
    expect(() =>
      buildInitialSectionRecords(createDefinition(), [
        { chave: "ausente", dataInicioPrevista: null },
      ]),
    ).toThrow(/não existe no modelo/);
  });
});
