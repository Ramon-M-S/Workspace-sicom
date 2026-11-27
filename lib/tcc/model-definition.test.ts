import { describe, expect, it } from "vitest";
import {
  conditionSchema,
  institutionalModelDefinitionSchema,
  type InstitutionalModelDefinition,
} from "./model-definition.schema";
import { composeInstitutionalModel } from "./composer";
import { evaluateCondition } from "./condition-evaluator";
import { modelRenderDataSchema } from "./model-data";
import { validateModelDefinitionSemantics } from "./semantic-validation";
import {
  assertVersionEditable,
  createNextDraftVersion,
  createProjectModelSnapshot,
  isVersionTransitionAllowed,
  transitionVersionStatus,
  updateDraftVersion,
} from "./versioning";
import { readAllowedModelDataPath } from "./model-data";

// Runtime-cast adversarial inputs bypass the public TypeScript contract.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnsafeRuntimeCast = any;

function createDefinition(
  overrides: Partial<InstitutionalModelDefinition> = {},
): InstitutionalModelDefinition {
  return {
    schemaVersion: 1,
    modelId: "modelo-exemplo",
    name: "Modelo demonstrativo",
    description: "Definição configurável para testes.",
    version: 1,
    status: "RASCUNHO",
    formatting: {
      page: {
        size: "custom",
        orientation: "portrait",
        widthMm: 180,
        heightMm: 260,
      },
      marginsMm: { top: 20, right: 18, bottom: 20, left: 18 },
      typography: {
        fontFamily: "Exemplo Sans",
        bodySizePt: 11,
        lineHeight: 1.4,
        sizes: { heading: 18 },
      },
      alignment: "left",
      spacing: {
        compact: { beforePt: 2, afterPt: 4 },
      },
      numbering: {
        enabled: true,
        style: "decimal",
        startAt: 1,
      },
      pagination: {
        enabled: true,
        position: "bottom",
        includeFirstPage: false,
      },
      styles: {
        heading: {
          fontSizePt: 18,
          fontWeight: 600,
          alignment: "center",
        },
      },
    },
    sections: [
      {
        key: "main",
        title: "Seção principal",
        category: "content",
        mode: "manual",
        required: true,
        numbered: true,
        order: 1,
        subsections: [
          {
            key: "details",
            title: "Detalhes",
            category: "content",
            mode: "hybrid",
            required: false,
            numbered: false,
            order: 2,
            subsections: [],
          },
        ],
      },
    ],
    automaticElements: [
      {
        key: "opening",
        title: "Bloco inicial",
        order: 1,
        blocks: [
          {
            id: "project-title",
            type: "field",
            field: "project.title",
            style: "heading",
            spacingToken: "compact",
            order: 2,
          },
          {
            id: "project-subtitle",
            type: "field",
            field: "project.subtitle",
            order: 1,
            when: { op: "exists", path: "project.subtitle" },
          },
          {
            id: "author-names",
            type: "list",
            source: "authors",
            itemField: "authors[].name",
            order: 3,
            when: {
              op: "collectionLength",
              path: "authors",
              comparator: "gt",
              value: 1,
            },
          },
          {
            id: "separator",
            type: "spacer",
            order: 0,
            spacing: { beforePt: 0, afterPt: 8 },
          },
        ],
      },
    ],
    ...overrides,
  };
}

const renderData = {
  project: {
    title: "Projeto Exemplo",
    subtitle: "Uma descrição curta",
    institution: "Instituição Configurada",
    city: "Cidade",
    year: 2026,
  },
  authors: [{ name: "Ana" }, { name: "Bia" }],
  sections: [
    { key: "main", title: "Título informado", content: "Conteúdo principal." },
  ],
};

describe("schema declarativo do modelo institucional", () => {
  it("aceita uma definição válida e extensões JSON", () => {
    const definition = createDefinition({
      extensions: { namespace: { option: true } },
      sections: [
        {
          ...createDefinition().sections[0],
          extensions: { displayHint: "custom" },
        },
      ],
    });

    expect(institutionalModelDefinitionSchema.safeParse(definition).success).toBe(true);
  });

  it("rejeita operadores, tipos de bloco e propriedades estruturais desconhecidos", () => {
    const badOperator = createDefinition() as unknown as Record<string, unknown>;
    const automaticElements = [
      {
        key: "opening",
        order: 1,
        blocks: [
          {
            id: "bad",
            type: "field",
            field: "project.title",
            order: 0,
            when: { op: "execute", expression: "globalThis.process.exit()" },
          },
        ],
      },
    ];

    expect(
      conditionSchema.safeParse({
        op: "execute",
        expression: "globalThis.process.exit()",
      }).success,
    ).toBe(false);
    expect(
      institutionalModelDefinitionSchema.safeParse({
        ...badOperator,
        automaticElements,
      }).success,
    ).toBe(false);
    expect(
      institutionalModelDefinitionSchema.safeParse({
        ...createDefinition(),
        unexpected: "ignored?",
      }).success,
    ).toBe(false);
  });

  it("rejeita expressões em texto no lugar da AST de condição", () => {
    expect(
      conditionSchema.safeParse('project.subtitle !== ""').success,
    ).toBe(false);
  });

  it("rejeita chaves perigosas nos campos de extensão", () => {
    const definition = JSON.parse(
      '{"schemaVersion":1,"modelId":"modelo","name":"Modelo","version":1,"status":"RASCUNHO",' +
        '"formatting":{"page":{"size":"custom","orientation":"portrait"},' +
        '"marginsMm":{"top":1,"right":1,"bottom":1,"left":1},' +
        '"typography":{"fontFamily":"Sans","bodySizePt":11,"lineHeight":1.4,"sizes":{}},' +
        '"alignment":"left","spacing":{},"numbering":{"enabled":false,"style":"none","startAt":1},' +
        '"pagination":{"enabled":false,"position":"bottom","includeFirstPage":false},' +
        '"styles":{}},"sections":[],"automaticElements":[],' +
        '"extensions":{"constructor":{"prototype":{"polluted":true}}}}',
    ) as unknown;

    expect(institutionalModelDefinitionSchema.safeParse(definition).success).toBe(false);
  });
});

describe("validação semântica", () => {
  it("rejeita referências desconhecidas e estilos sem definição", () => {
    const definition = createDefinition({
      automaticElements: [
        {
          key: "opening",
          order: 1,
          blocks: [
            {
              id: "unknown-property",
              type: "field",
              field: "project.constructor",
              style: "missing-style",
              order: 0,
            },
          ],
        },
      ],
    });

    const issues = validateModelDefinitionSemantics(definition);

    expect(issues.map((issue) => issue.code)).toContain("DANGEROUS_DATA_PATH");
    expect(issues.map((issue) => issue.code)).toContain("UNKNOWN_STYLE");
  });

  it("rejeita caminhos fora do registro e comparações com coleções", () => {
    const definition = createDefinition({
      automaticElements: [
        {
          key: "opening",
          order: 1,
          blocks: [
            {
              id: "unknown-property",
              type: "field",
              field: "project.department",
              order: 0,
            },
            {
              id: "collection-equality",
              type: "text",
              text: "Texto",
              order: 1,
              when: {
                op: "equals",
                path: "authors[].name",
                value: "Ana",
              },
            },
          ],
        },
      ],
    });

    expect(
      validateModelDefinitionSemantics(definition).map((issue) => issue.code),
    ).toEqual(
      expect.arrayContaining(["UNKNOWN_DATA_PATH", "INVALID_CONDITION_TYPE"]),
    );
  });

  it("rejeita configurações semanticamente inconsistentes sem impor padrões institucionais", () => {
    const definition = createDefinition({
      formatting: {
        ...createDefinition().formatting,
        page: {
          size: "custom",
          orientation: "portrait",
          widthMm: 12,
          heightMm: 10,
        },
        numbering: {
          enabled: true,
          style: "none",
          startAt: 1,
        },
      },
    });

    expect(
      validateModelDefinitionSemantics(definition).map((issue) => issue.code),
    ).toEqual(
      expect.arrayContaining([
        "INVALID_PAGE_DIMENSIONS",
        "INVALID_NUMBERING_CONFIGURATION",
      ]),
    );
    expect(
      institutionalModelDefinitionSchema.safeParse(
        createDefinition({ name: "Qualquer modelo configurado" }),
      ).success,
    ).toBe(true);
  });

  it("rejeita operadores numéricos aplicados a dados textuais", () => {
    const definition = createDefinition({
      automaticElements: [
        {
          key: "opening",
          order: 1,
          blocks: [
            {
              id: "invalid-condition",
              type: "text",
              text: "Texto",
              order: 0,
              when: {
                op: "compare",
                path: "project.title",
                comparator: "gt",
                value: 2,
              },
            },
          ],
        },
      ],
    });

    expect(
      validateModelDefinitionSemantics(definition).map((issue) => issue.code),
    ).toContain("INVALID_CONDITION_TYPE");
  });

  it("rejeita listas cuja referência não pertence à coleção declarada", () => {
    const definition = createDefinition({
      automaticElements: [
        {
          key: "opening",
          order: 1,
          blocks: [
            {
              id: "wrong-source",
              type: "list",
              source: "authors",
              itemField: "sections[].title",
              order: 0,
            },
          ],
        },
      ],
    });

    expect(
      validateModelDefinitionSemantics(definition).map((issue) => issue.code),
    ).toContain("INVALID_LIST_REFERENCE");
  });
});

describe("motor declarativo e avaliação segura", () => {
  it("avalia condições, aplica estilos e espaçamentos e ordena blocos e seções", () => {
    const result = composeInstitutionalModel(createDefinition(), renderData);

    expect(result.automaticElements[0].children.map((node) => node.id)).toEqual([
      "separator",
      "project-subtitle",
      "project-title",
      "author-names",
    ]);
    expect(result.automaticElements[0].children[2]).toMatchObject({
      kind: "field",
      value: "Projeto Exemplo",
      style: { fontSizePt: 18, alignment: "center" },
      spacing: { beforePt: 2, afterPt: 4 },
    });
    expect(result.automaticElements[0].children[3]).toMatchObject({
      kind: "list",
      values: ["Ana", "Bia"],
    });
    expect(result.sections[0]).toMatchObject({
      key: "main",
      content: "Conteúdo principal.",
      children: [{ key: "details", order: 2 }],
    });
  });

  it("omite elementos condicionais quando o campo está ausente ou há um único autor", () => {
    const data = {
      project: { title: "Projeto" },
      authors: [{ name: "Ana" }],
      sections: [],
    };
    const result = composeInstitutionalModel(createDefinition(), data);

    expect(
      result.automaticElements[0].children.map((node) => node.id),
    ).not.toContain("project-subtitle");
    expect(
      result.automaticElements[0].children.map((node) => node.id),
    ).not.toContain("author-names");
  });

  it("usa somente propriedades próprias do registro explícito", () => {
    const inheritedData = Object.create({
      project: { title: "Valor herdado" },
    }) as unknown;

    expect(
      readAllowedModelDataPath(inheritedData, "project.title"),
    ).toMatchObject({ found: false });
    expect(() =>
      composeInstitutionalModel(createDefinition(), inheritedData),
    ).toThrow();
  });

  it("rejeita acessores sem executá-los", () => {
    let getterExecuted = false;
    const data = Object.defineProperty({}, "project", {
      enumerable: true,
      get() {
        getterExecuted = true;
        return { title: "Não deve ser lido" };
      },
    });

    expect(() => composeInstitutionalModel(createDefinition(), data)).toThrow();
    expect(getterExecuted).toBe(false);
  });

  it("rejeita caminhos com __proto__, prototype e constructor", () => {
    for (const path of [
      "project.__proto__",
      "project.prototype",
      "project.constructor",
      "Object.prototype",
    ]) {
      expect(() => readAllowedModelDataPath(renderData, path)).toThrow();
      expect(() =>
        evaluateCondition({ op: "exists", path } as UnsafeRuntimeCast, renderData),
      ).toThrow();
      const definition = createDefinition({
        automaticElements: [
          {
            key: "dangerous-path",
            order: 1,
            blocks: [
              {
                id: "condition",
                type: "text",
                text: "Não deve renderizar",
                order: 1,
                when: { op: "exists", path } as UnsafeRuntimeCast,
              },
            ],
          },
        ],
      });
      expect(
        validateModelDefinitionSemantics(definition).map((issue) => issue.code),
      ).toEqual(expect.arrayContaining(["DANGEROUS_DATA_PATH"]));
    }
  });

  it("rejeita protótipos personalizados sem ler propriedades herdadas", () => {
    const forgedData = Object.assign(
      Object.create({ project: { title: "Herdado" } }),
      { authors: [], sections: [] },
    );
    expect(modelRenderDataSchema.safeParse(forgedData).success).toBe(false);
    expect(() =>
      evaluateCondition(
        { op: "exists", path: "project.title" },
        forgedData,
      ),
    ).toThrow();
  });

  it("não executa getters ou setters durante validação estrutural", () => {
    let accessCount = 0;
    const definition = createDefinition();
    Object.defineProperty(definition, "name", {
      configurable: true,
      enumerable: true,
      get() {
        accessCount += 1;
        return "Não deve ser lido";
      },
      set() {
        accessCount += 1;
      },
    });

    expect(institutionalModelDefinitionSchema.safeParse(definition).success).toBe(
      false,
    );
    expect(() =>
      validateModelDefinitionSemantics(definition as UnsafeRuntimeCast),
    ).toThrow();
    expect(accessCount).toBe(0);

    const condition = Object.defineProperty({}, "op", {
      configurable: true,
      enumerable: true,
      get() {
        accessCount += 1;
        return "exists";
      },
      set() {
        accessCount += 1;
      },
    });
    expect(conditionSchema.safeParse(condition).success).toBe(false);
    expect(() =>
      evaluateCondition(condition as UnsafeRuntimeCast, renderData),
    ).toThrow();
    expect(accessCount).toBe(0);
  });

  it("não executa acessores em objetos aninhados nem em arrays de entrada", () => {
    let accessCount = 0;
    const project = Object.defineProperty({}, "title", {
      configurable: true,
      enumerable: true,
      get() {
        accessCount += 1;
        return "Não deve ser lido";
      },
      set() {
        accessCount += 1;
      },
    });
    const author = Object.defineProperty({}, "name", {
      configurable: true,
      enumerable: true,
      get() {
        accessCount += 1;
        return "Não deve ser lido";
      },
      set() {
        accessCount += 1;
      },
    });
    const authors = [author];
    const data = {
      project,
      authors,
      sections: [],
    };

    expect(() =>
      evaluateCondition({ op: "exists", path: "project.title" }, data),
    ).toThrow();
    expect(modelRenderDataSchema.safeParse(data).success).toBe(false);
    expect(() => composeInstitutionalModel(createDefinition(), data)).toThrow();
    expect(accessCount).toBe(0);

    const arrayAccessor = [] as unknown[];
    Object.defineProperty(arrayAccessor, "0", {
      configurable: true,
      enumerable: true,
      get() {
        accessCount += 1;
        return { name: "Não deve ser lido" };
      },
      set() {
        accessCount += 1;
      },
    });
    arrayAccessor.length = 1;
    expect(
      modelRenderDataSchema.safeParse({
        project: { title: "Projeto" },
        authors: arrayAccessor,
        sections: [],
      }).success,
    ).toBe(false);
    expect(accessCount).toBe(0);

    expect(() =>
      evaluateCondition(
        {
          op: "collectionLength",
          path: "authors",
          comparator: "gt",
          value: 0,
        },
        {
          project: { title: "Projeto" },
          authors: arrayAccessor,
          sections: [],
        },
      ),
    ).toThrow();
    expect(accessCount).toBe(0);
  });

  it("rejeita operadores desconhecidos passados diretamente em runtime", () => {
    expect(() =>
      evaluateCondition(
        { op: "execute", expression: "globalThis.process.exit()" } as UnsafeRuntimeCast,
        renderData,
      ),
    ).toThrow(/condição declarativa inválida/i);
  });

  it("avalia ASTs permitidas e não aceita caminhos de protótipo", () => {
    expect(
      evaluateCondition(
        {
          op: "collectionLength",
          path: "authors",
          comparator: "gt",
          value: 1,
        },
        renderData,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        { op: "exists", path: "project.subtitle" },
        renderData,
      ),
    ).toBe(true);
    expect(() =>
      evaluateCondition(
        { op: "exists", path: "project.constructor" },
        renderData,
      ),
    ).toThrow();
  });

  it("compõe definições com nomes e tokens diferentes sem regras por instituição", () => {
    const modelA = createDefinition({ name: "Modelo Alfa" });
    const modelB = createDefinition({
      name: "Modelo Beta",
      formatting: {
        ...createDefinition().formatting,
        alignment: "right",
      },
    });

    expect(composeInstitutionalModel(modelA, renderData).modelName).toBe("Modelo Alfa");
    expect(composeInstitutionalModel(modelB, renderData).formatting.alignment).toBe(
      "right",
    );
  });

  it("avalia equals, compare, all, any e not", () => {
    expect(
      evaluateCondition(
        { op: "equals", path: "project.title", value: "Projeto Exemplo" },
        renderData,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        {
          op: "compare",
          path: "project.year",
          comparator: "gte",
          value: 2026,
        },
        renderData,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        {
          op: "all",
          conditions: [
            { op: "exists", path: "project.subtitle" },
            { op: "equals", path: "project.year", value: 2026 },
          ],
        },
        renderData,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        {
          op: "any",
          conditions: [
            { op: "equals", path: "project.year", value: 2025 },
            { op: "equals", path: "project.title", value: "Projeto Exemplo" },
          ],
        },
        renderData,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        {
          op: "not",
          condition: { op: "equals", path: "project.year", value: 2025 },
        },
        renderData,
      ),
    ).toBe(true);
  });

  it("avalia condições de elementos automáticos e de blocos", () => {
    const definition = createDefinition({
      automaticElements: [
        {
          key: "hidden-element",
          order: 0,
          when: { op: "equals", path: "project.year", value: 2025 },
          blocks: [],
        },
        {
          key: "visible-element",
          order: 1,
          when: {
            op: "all",
            conditions: [
              { op: "exists", path: "project.title" },
              {
                op: "compare",
                path: "project.year",
                comparator: "gte",
                value: 2026,
              },
            ],
          },
          blocks: [
            {
              id: "visible-block",
              type: "text",
              text: "Visível",
              order: 1,
              when: {
                op: "not",
                condition: {
                  op: "equals",
                  path: "project.title",
                  value: "Outro",
                },
              },
            },
            {
              id: "hidden-block",
              type: "text",
              text: "Oculto",
              order: 0,
              when: { op: "any", conditions: [
                { op: "equals", path: "project.year", value: 2025 },
                { op: "equals", path: "project.title", value: "Outro" },
              ] },
            },
          ],
        },
      ],
    });

    const result = composeInstitutionalModel(definition, renderData);
    expect(result.automaticElements.map((element) => element.key)).toEqual([
      "visible-element",
    ]);
    expect(result.automaticElements[0].children.map((block) => block.id)).toEqual([
      "visible-block",
    ]);
  });

  it("ordena elementos, seções e subseções e preserva a ordem original em empates", () => {
    const rootSection = createDefinition().sections[0];
    const definition = createDefinition({
      sections: [
        { ...rootSection, key: "later", order: 2, subsections: [] },
        {
          ...rootSection,
          key: "first-tie",
          order: 1,
          subsections: [
            { ...rootSection.subsections[0], key: "sub-later", order: 2 },
            { ...rootSection.subsections[0], key: "sub-first-tie", order: 1 },
            { ...rootSection.subsections[0], key: "sub-second-tie", order: 1 },
          ],
        },
        { ...rootSection, key: "second-tie", order: 1, subsections: [] },
      ],
      automaticElements: [
        {
          key: "element-later",
          order: 2,
          blocks: [{ id: "block-later", type: "text", text: "L", order: 2 }],
        },
        {
          key: "element-first-tie",
          order: 1,
          blocks: [
            { id: "block-first-tie", type: "text", text: "A", order: 1 },
            { id: "block-second-tie", type: "text", text: "B", order: 1 },
          ],
        },
        { key: "element-second-tie", order: 1, blocks: [] },
      ],
    });
    const data = { ...renderData, sections: [] };
    const result = composeInstitutionalModel(definition, data);

    expect(result.automaticElements.map((element) => element.key)).toEqual([
      "element-first-tie",
      "element-second-tie",
      "element-later",
    ]);
    expect(result.automaticElements[0].children.map((block) => block.id)).toEqual([
      "block-first-tie",
      "block-second-tie",
    ]);
    expect(result.sections.map((section) => section.key)).toEqual([
      "first-tie",
      "second-tie",
      "later",
    ]);
    expect(
      result.sections[0].children.map((section) => section.key),
    ).toEqual(["sub-first-tie", "sub-second-tie", "sub-later"]);
  });

  it("aplica precedência de estilo e espaçamento inline sobre tokens e padrões", () => {
    const definition = createDefinition({
      automaticElements: [
        {
          key: "styled",
          order: 1,
          blocks: [
            {
              id: "styled-title",
              type: "field",
              field: "project.title",
              style: "heading",
              typography: { fontSizePt: 22, fontWeight: 700 },
              alignment: "right",
              spacingToken: "compact",
              spacing: { afterPt: 9 },
              order: 1,
            },
          ],
        },
      ],
    });

    const [node] = composeInstitutionalModel(definition, renderData)
      .automaticElements[0].children;
    expect(node).toMatchObject({
      style: {
        fontFamily: "Exemplo Sans",
        fontSizePt: 22,
        fontWeight: 700,
        alignment: "right",
      },
      spacing: { beforePt: 2, afterPt: 9 },
    });
  });

  it("rejeita campos sem valor e seções de dados sem referência no modelo", () => {
    const missingField = createDefinition({
      automaticElements: [
        {
          key: "missing-field",
          order: 1,
          blocks: [
            {
              id: "subtitle",
              type: "field",
              field: "project.subtitle",
              order: 1,
            },
          ],
        },
      ],
    });
    expect(() =>
      composeInstitutionalModel(missingField, {
        project: { title: "Projeto" },
        authors: [],
        sections: [],
      }),
    ).toThrow(/não possui valor/i);

    expect(() =>
      composeInstitutionalModel(createDefinition(), {
        ...renderData,
        sections: [{ key: "unknown-section", title: "Sem referência" }],
      }),
    ).toThrow(/não existe no modelo/i);
  });

  it("mantém paginação e numeração como metadados, sem gerar páginas físicas", () => {
    const result = composeInstitutionalModel(createDefinition(), renderData);

    expect(result.formatting.pagination).toEqual({
      enabled: true,
      position: "bottom",
      includeFirstPage: false,
    });
    expect(result.formatting.numbering).toEqual({
      enabled: true,
      style: "decimal",
      startAt: 1,
    });
    expect(Object.hasOwn(result, "pages")).toBe(false);
    expect(Object.hasOwn(result.sections[0], "pageNumber")).toBe(false);
  });
});

describe("versionamento e snapshots", () => {
  it("permite apenas as transições RASCUNHO -> PUBLICADA -> ARQUIVADA", () => {
    expect(isVersionTransitionAllowed("RASCUNHO", "PUBLICADA")).toBe(true);
    expect(isVersionTransitionAllowed("PUBLICADA", "ARQUIVADA")).toBe(true);
    expect(isVersionTransitionAllowed("RASCUNHO", "ARQUIVADA")).toBe(false);
    expect(isVersionTransitionAllowed("ARQUIVADA", "RASCUNHO")).toBe(false);

    expect(transitionVersionStatus({ status: "RASCUNHO" }, "PUBLICADA")).toEqual({
      status: "PUBLICADA",
    });
    expect(() =>
      transitionVersionStatus({ status: "RASCUNHO" }, "ARQUIVADA"),
    ).toThrow();
  });

  it("impede edição de versões publicadas/arquivadas e cria uma nova versão rascunho", () => {
    expect(() => assertVersionEditable("RASCUNHO")).not.toThrow();
    expect(() => assertVersionEditable("PUBLICADA")).toThrow(/nova versão/i);
    expect(() => assertVersionEditable("ARQUIVADA")).toThrow(/nova versão/i);

    const published = createDefinition({ status: "PUBLICADA" });
    expect(createNextDraftVersion(published)).toMatchObject({
      version: 2,
      status: "RASCUNHO",
      name: published.name,
    });
    expect(published).toMatchObject({ version: 1, status: "PUBLICADA" });
  });

  it("atualiza somente rascunhos e retorna uma cópia validada", () => {
    const draft = createDefinition();
    const updated = updateDraftVersion(draft, { name: "Rascunho atualizado" });

    expect(updated.name).toBe("Rascunho atualizado");
    expect(draft.name).toBe("Modelo demonstrativo");
    expect(() =>
      updateDraftVersion(
        createDefinition({ status: "PUBLICADA" }),
        { name: "Alteração proibida" },
      ),
    ).toThrow(/nova versão/i);
  });

  it("rejeita individualmente qualquer campo protegido mesmo via any", () => {
    const protectedChanges = [
      { modelId: "outro-modelo" },
      { schemaVersion: 2 },
      { version: 2 },
      { status: "PUBLICADA" },
    ];

    for (const changes of protectedChanges) {
      expect(() =>
        updateDraftVersion(createDefinition(), changes as UnsafeRuntimeCast),
      ).toThrow(/campos protegidos/i);
    }
    expect(() =>
      updateDraftVersion(createDefinition(), { version: 1 } as UnsafeRuntimeCast),
    ).toThrow(/version/i);
  });

  it("rejeita alterações simultâneas e conflitos de versão ou estado protegidos", () => {
    expect(() =>
      updateDraftVersion(
        createDefinition(),
        {
          name: "Mudança concorrente",
          version: 2,
          status: "ARQUIVADA",
        } as UnsafeRuntimeCast,
      ),
    ).toThrow(/version, status/i);
    expect(() =>
      updateDraftVersion(
        createDefinition({ status: "PUBLICADA" }),
        { name: "Conflito", status: "PUBLICADA" } as UnsafeRuntimeCast,
      ),
    ).toThrow(/imutáveis/i);
  });

  it("cria nova versão arquivada independente sem mutar o original", () => {
    const archived = createDefinition({ status: "ARQUIVADA" });
    const original = structuredClone(archived);
    const next = createNextDraftVersion(archived);

    next.formatting.spacing.compact.afterPt = 25;
    next.sections[0].subsections[0].title = "Subseção nova";
    expect(archived).toEqual(original);
    expect(next).toMatchObject({
      modelId: archived.modelId,
      version: 2,
      status: "RASCUNHO",
    });
    expect(next.formatting.spacing.compact.afterPt).toBe(25);
    expect(archived.formatting.spacing.compact.afterPt).toBe(4);
  });

  it("rejeita snapshots semanticamente inválidos", () => {
    const invalid = createDefinition({
      automaticElements: [
        {
          key: "invalid-style",
          order: 1,
          blocks: [
            {
              id: "title",
              type: "field",
              field: "project.title",
              style: "missing",
              order: 1,
            },
          ],
        },
      ],
    });

    expect(() => createProjectModelSnapshot(invalid)).toThrow(
      /missing|estilo/i,
    );
  });

  it("mantém as funções puras sem mutar qualquer objeto de entrada", () => {
    const draft = createDefinition();
    const draftBefore = structuredClone(draft);
    const published = createDefinition({ status: "PUBLICADA" });
    const publishedBefore = structuredClone(published);
    const snapshotInput = createDefinition();
    const snapshotBefore = structuredClone(snapshotInput);
    const transitionInput: {
      status: "RASCUNHO";
      nested: { value: number };
    } = { status: "RASCUNHO", nested: { value: 1 } };
    const transitionBefore = structuredClone(transitionInput);

    updateDraftVersion(draft, { name: "Atualizado" });
    createNextDraftVersion(published);
    createProjectModelSnapshot(snapshotInput);
    transitionVersionStatus(transitionInput, "PUBLICADA");

    expect(draft).toEqual(draftBefore);
    expect(published).toEqual(publishedBefore);
    expect(snapshotInput).toEqual(snapshotBefore);
    expect(transitionInput).toEqual(transitionBefore);
  });

  it("cria cópia independente e profundamente imutável do modelo validado", () => {
    const original = createDefinition();
    const snapshot = createProjectModelSnapshot(original);

    original.formatting.spacing.compact.afterPt = 99;
    original.sections[0].title = "Mutado";

    expect(snapshot.formatting.spacing.compact.afterPt).toBe(4);
    expect(snapshot.sections[0].title).toBe("Seção principal");
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.sections[0])).toBe(true);
    expect(Object.isFrozen(snapshot.formatting.spacing.compact)).toBe(true);
  });

  it("não cria snapshot de definição estruturalmente inválida", () => {
    expect(() =>
      createProjectModelSnapshot({
        ...createDefinition(),
        schemaVersion: 99,
      }),
    ).toThrow();
  });
});
