import { describe, expect, it } from "vitest";
import {
  editorDocumentSchema,
  extractEditorBlockReferences,
  extractEditorFileReferences,
  normalizeEditorDocument,
  parseEditorDocument,
  validateEditorDocumentIntegrity,
  type EditorBlockIdFactory,
} from "./editor-document.schema";

const blockId = (suffix: string) => `00000000-0000-4000-8000-${suffix.padStart(12, "0")}`;

function createValidDocument() {
  return {
    schemaVersion: 1,
    documentId: "documento-exemplo",
    title: "Documento acadêmico",
    extensions: { namespace: { configured: true } },
    blocks: [
      {
        type: "heading",
        blockId: blockId("1"),
        level: 1,
        content: [
          {
            type: "text",
            blockId: blockId("2"),
            text: "Título",
            marks: ["bold"],
          },
        ],
      },
      {
        type: "paragraph",
        blockId: blockId("3"),
        content: [
          { type: "text", blockId: blockId("4"), text: "Texto do parágrafo." },
          { type: "hardBreak", blockId: blockId("5") },
        ],
      },
      {
        type: "blockquote",
        blockId: blockId("6"),
        citation: "Fonte de exemplo",
        content: [
          {
            type: "paragraph",
            blockId: blockId("7"),
            content: [
              { type: "text", blockId: blockId("8"), text: "Trecho citado." },
            ],
          },
        ],
      },
      {
        type: "bulletList",
        blockId: blockId("9"),
        items: [
          {
            type: "listItem",
            blockId: blockId("10"),
            content: [
              {
                type: "paragraph",
                blockId: blockId("11"),
                content: [
                  { type: "text", blockId: blockId("12"), text: "Item." },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "orderedList",
        blockId: blockId("13"),
        startAt: 1,
        items: [
          {
            type: "listItem",
            blockId: blockId("14"),
            content: [
              {
                type: "paragraph",
                blockId: blockId("15"),
                content: [
                  { type: "text", blockId: blockId("16"), text: "Primeiro." },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "table",
        blockId: blockId("17"),
        caption: "Tabela de exemplo",
        rows: [
          {
            type: "tableRow",
            blockId: blockId("18"),
            cells: [
              {
                type: "tableCell",
                blockId: blockId("19"),
                header: true,
                content: [
                  {
                    type: "paragraph",
                    blockId: blockId("20"),
                    content: [
                      { type: "text", blockId: blockId("21"), text: "Coluna" },
                    ],
                  },
                ],
              },
              {
                type: "tableCell",
                blockId: blockId("22"),
                content: [],
              },
            ],
          },
          {
            type: "tableRow",
            blockId: blockId("23"),
            cells: [
              {
                type: "tableCell",
                blockId: blockId("24"),
                content: [],
              },
              {
                type: "tableCell",
                blockId: blockId("25"),
                content: [],
              },
            ],
          },
        ],
      },
      {
        type: "image",
        blockId: blockId("26"),
        fileId: "arquivo-imagem-01",
        altText: "Gráfico ilustrativo",
        caption: "Figura 1",
        sourceCredit: "Acervo do projeto",
        width: 640,
        height: 480,
      },
      {
        type: "attachment",
        blockId: blockId("27"),
        attachmentId: "anexo-contrato-01",
        displayName: "Documento complementar",
        caption: "Material de apoio",
      },
      {
        type: "fileRef",
        blockId: blockId("28"),
        fileId: "arquivo-planilha-02",
        label: "Planilha de dados",
      },
    ],
  };
}

function deterministicIdFactory(): EditorBlockIdFactory {
  return ({ path }) => {
    let hash = 2166136261;
    for (const character of path) {
      hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
    }
    return `00000000-0000-4000-8000-${hash
      .toString(16)
      .padStart(12, "0")}`;
  };
}

describe("schema e formato do documento do editor", () => {
  it("aceita documento completo com blocos, listas, tabela, arquivos e extensões", () => {
    const result = editorDocumentSchema.safeParse(createValidDocument());

    expect(result.success).toBe(true);
    expect(parseEditorDocument(createValidDocument()).blocks).toHaveLength(9);
  });

  it("rejeita tipos e estruturas inválidas de heading, lista e tabela", () => {
    const valid = createValidDocument();
    const invalid = {
      ...valid,
      blocks: [
        { type: "heading", blockId: blockId("40"), level: 7, content: [] },
        {
          type: "bulletList",
          blockId: blockId("41"),
          items: [],
        },
        {
          type: "table",
          blockId: blockId("42"),
          rows: [],
        },
      ],
    };

    expect(editorDocumentSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejeita blockId ausente ou vazio no schema estrutural", () => {
    const valid = createValidDocument();
    const missingId = structuredClone(valid);
    delete (missingId.blocks[0] as Record<string, unknown>).blockId;
    const emptyId = structuredClone(valid);
    (emptyId.blocks[0] as Record<string, unknown>).blockId = "";

    expect(editorDocumentSchema.safeParse(missingId).success).toBe(false);
    expect(editorDocumentSchema.safeParse(emptyId).success).toBe(false);
  });

  it("detecta blockId duplicado e rejeita tabelas não retangulares", () => {
    const duplicate = createValidDocument();
    duplicate.blocks[1].blockId = duplicate.blocks[0].blockId;
    expect(() => validateEditorDocumentIntegrity(duplicate)).toThrow(
      /duplicado/i,
    );

    const table = parseEditorDocument(createValidDocument());
    const tableBlock = table.blocks.find((block) => block.type === "table");
    if (!tableBlock || tableBlock.type !== "table") {
      throw new Error("Tabela de teste ausente.");
    }
    tableBlock.rows[1].cells.pop();
    expect(() => validateEditorDocumentIntegrity(table)).toThrow(
      /mesmo número de células/i,
    );
  });

  it("rejeita referências de arquivo vazias, ausentes ou ambíguas", () => {
    const document = createValidDocument();
    document.blocks.push(
      {
        type: "image",
        blockId: blockId("50"),
        altText: "Sem arquivo",
      } as never,
      {
        type: "attachment",
        blockId: blockId("51"),
        fileId: " ",
        attachmentId: "outro",
        displayName: "Referência inválida",
      } as never,
    );

    expect(editorDocumentSchema.safeParse(document).success).toBe(false);
  });

  it("rejeita campos desconhecidos e payloads que poderiam embutir binários", () => {
    const document = createValidDocument();
    (document.blocks[7] as Record<string, unknown>).binary = "base64-payload";

    expect(editorDocumentSchema.safeParse(document).success).toBe(false);
  });

  it("rejeita chaves perigosas, símbolos, acessores e protótipos personalizados", () => {
    for (const key of ["__proto__", "prototype", "constructor"]) {
      const dangerous = JSON.parse(
        `{"schemaVersion":1,"documentId":"doc","blocks":[],"extensions":{"${key}":{"x":1}}}`,
      ) as unknown;
      expect(editorDocumentSchema.safeParse(dangerous).success).toBe(false);
    }

    const withSymbol = createValidDocument();
    Object.defineProperty(withSymbol, Symbol("extra"), { value: true });
    expect(editorDocumentSchema.safeParse(withSymbol).success).toBe(false);

    let accessorCalls = 0;
    const withGetter = createValidDocument();
    Object.defineProperty(withGetter, "title", {
      enumerable: true,
      get() {
        accessorCalls += 1;
        return "Não deve ser lido";
      },
      set() {
        accessorCalls += 1;
      },
    });
    expect(editorDocumentSchema.safeParse(withGetter).success).toBe(false);
    expect(accessorCalls).toBe(0);

    const customPrototype = Object.assign(
      Object.create({ inherited: true }),
      createValidDocument(),
    );
    expect(editorDocumentSchema.safeParse(customPrototype).success).toBe(false);
  });

  it("rejeita extensões que tornariam o documento um payload excessivamente grande", () => {
    const document = {
      schemaVersion: 1,
      documentId: "doc-large",
      blocks: [],
      extensions: { note: "x".repeat(1_000_001) },
    };

    expect(editorDocumentSchema.safeParse(document).success).toBe(false);
  });
});

describe("normalização e identidade de blocos", () => {
  it("preserva IDs existentes e gera IDs determinísticos apenas para nós novos", () => {
    expect(normalizeEditorDocument(createValidDocument())).toEqual(
      parseEditorDocument(createValidDocument()),
    );

    const input = {
      schemaVersion: 1,
      documentId: "doc-normalize",
      blocks: [
        {
          type: "paragraph",
          blockId: blockId("60"),
          content: [
            { type: "text", text: "Preservado" },
            { type: "text", blockId: blockId("61"), text: "Já identificado" },
          ],
        },
      ],
    };
    const inputBefore = structuredClone(input);
    const createBlockId = deterministicIdFactory();
    const first = normalizeEditorDocument(input, createBlockId);
    const second = normalizeEditorDocument(input, createBlockId);

    expect(first).toEqual(second);
    expect(first.blocks[0].blockId).toBe(blockId("60"));
    if (first.blocks[0].type !== "paragraph") throw new Error("Parágrafo esperado.");
    expect(first.blocks[0].content[1].blockId).toBe(blockId("61"));
    expect(first.blocks[0].content[0].blockId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(input).toEqual(inputBefore);
  });

  it("não altera IDs existentes em uma edição e não muta estruturas aninhadas", () => {
    const input = createValidDocument();
    const inputBefore = structuredClone(input);
    const normalized = normalizeEditorDocument(input, deterministicIdFactory());

    if (normalized.blocks[0].type !== "heading") {
      throw new Error("Título de teste ausente.");
    }
    normalized.blocks[0].content[0] = {
      type: "text",
      blockId: blockId("70"),
      text: "Texto editado",
    };

    expect(input).toEqual(inputBefore);
    expect(input.blocks[0].blockId).toBe(blockId("1"));
    expect(normalized.blocks[0].blockId).toBe(blockId("1"));
  });

  it("rejeita blockId inválido existente sem substituí-lo silenciosamente", () => {
    const input = {
      schemaVersion: 1,
      documentId: "doc-invalid-id",
      blocks: [{ type: "paragraph", blockId: "", content: [] }],
    };
    expect(() =>
      normalizeEditorDocument(input, deterministicIdFactory()),
    ).toThrow(/blockId inválido/i);
  });

  it("exige uma fábrica quando há IDs ausentes e rejeita IDs gerados duplicados", () => {
    const input = {
      schemaVersion: 1,
      documentId: "doc-no-factory",
      blocks: [
        { type: "paragraph", content: [] },
        { type: "paragraph", content: [] },
      ],
    };
    expect(() => normalizeEditorDocument(input)).toThrow(/fábrica determinística/i);
    expect(() =>
      normalizeEditorDocument(input, () => blockId("80")),
    ).toThrow(/duplicado/i);
  });

  it("rejeita getters/setters e protótipos personalizados antes de normalizar", () => {
    let calls = 0;
    const input = {
      schemaVersion: 1,
      documentId: "doc-accessor",
      blocks: [
        Object.defineProperty(
          { type: "paragraph", content: [] },
          "blockId",
          {
            enumerable: true,
            get() {
              calls += 1;
              return blockId("90");
            },
            set() {
              calls += 1;
            },
          },
        ),
      ],
    };
    expect(() =>
      normalizeEditorDocument(input, deterministicIdFactory()),
    ).toThrow(/acessor/i);
    expect(calls).toBe(0);

    const itemAccessor = Object.defineProperty(
      { type: "paragraph", content: [] },
      "type",
      {
        enumerable: true,
        get() {
          calls += 1;
          return "paragraph";
        },
        set() {
          calls += 1;
        },
      },
    );
    expect(() =>
      normalizeEditorDocument(
        {
          schemaVersion: 1,
          documentId: "doc-array-accessor",
          blocks: [itemAccessor],
        },
        deterministicIdFactory(),
      ),
    ).toThrow(/acessor/i);
    expect(calls).toBe(0);

    const customPrototype = Object.assign(
      Object.create({ inherited: true }),
      {
        schemaVersion: 1,
        documentId: "doc-proto",
        blocks: [],
      },
    );
    expect(() =>
      normalizeEditorDocument(customPrototype, deterministicIdFactory()),
    ).toThrow(/protótipo/i);
  });
});

describe("extração de âncoras e referências a arquivos", () => {
  it("lista IDs e tipos de todos os nós editáveis em ordem de documento", () => {
    const references = extractEditorBlockReferences(createValidDocument());

    expect(references).toHaveLength(28);
    expect(references[0]).toMatchObject({
      blockId: blockId("1"),
      type: "heading",
      path: "blocks[0]",
    });
    expect(references.map((reference) => reference.blockId)).toContain(
      blockId("19"),
    );
  });

  it("extrai referências leves de imagens, anexos e fileRef com seus metadados", () => {
    const references = extractEditorFileReferences(createValidDocument());

    expect(references).toEqual([
      {
        blockId: blockId("26"),
        type: "image",
        fileId: "arquivo-imagem-01",
        altText: "Gráfico ilustrativo",
        caption: "Figura 1",
        sourceCredit: "Acervo do projeto",
        width: 640,
        height: 480,
      },
      {
        blockId: blockId("27"),
        type: "attachment",
        attachmentId: "anexo-contrato-01",
        displayName: "Documento complementar",
        caption: "Material de apoio",
      },
      {
        blockId: blockId("28"),
        type: "fileRef",
        fileId: "arquivo-planilha-02",
        label: "Planilha de dados",
      },
    ]);
  });
});
