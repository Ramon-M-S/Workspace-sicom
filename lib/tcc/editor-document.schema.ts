import { z } from "zod";
import { extensionsSchema, type JsonValue } from "./model-definition.schema";
import { cloneSafeJsonValue, safeJsonSchema } from "./safe-json";

const blockIdSchema = z.string().uuid();
const fileReferenceIdSchema = z.string().trim().min(1).max(128);
const nonEmptyTextSchema = z.string().trim().min(1).max(10_000);

const editorNodeBaseShape = {
  blockId: blockIdSchema,
  extensions: extensionsSchema.optional(),
};

export interface EditorTextNode {
  type: "text";
  blockId: string;
  text: string;
  marks?: Array<"bold" | "italic" | "underline" | "code">;
  extensions?: Record<string, JsonValue>;
}

export interface EditorHardBreakNode {
  type: "hardBreak";
  blockId: string;
  extensions?: Record<string, JsonValue>;
}

export type EditorInlineNode = EditorTextNode | EditorHardBreakNode;

export interface EditorParagraphBlock {
  type: "paragraph";
  blockId: string;
  content: EditorInlineNode[];
  extensions?: Record<string, JsonValue>;
}

export interface EditorHeadingBlock {
  type: "heading";
  blockId: string;
  level: EditorHeadingLevel;
  content: EditorInlineNode[];
  extensions?: Record<string, JsonValue>;
}

export type EditorHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface EditorBlockquoteBlock {
  type: "blockquote";
  blockId: string;
  content: EditorBlock[];
  citation?: string;
  extensions?: Record<string, JsonValue>;
}

export interface EditorListItem {
  type: "listItem";
  blockId: string;
  content: EditorBlock[];
  extensions?: Record<string, JsonValue>;
}

export interface EditorBulletListBlock {
  type: "bulletList";
  blockId: string;
  items: EditorListItem[];
  extensions?: Record<string, JsonValue>;
}

export interface EditorOrderedListBlock {
  type: "orderedList";
  blockId: string;
  startAt: number;
  items: EditorListItem[];
  extensions?: Record<string, JsonValue>;
}

export interface EditorTableCell {
  type: "tableCell";
  blockId: string;
  content: EditorBlock[];
  header?: boolean;
  extensions?: Record<string, JsonValue>;
}

export interface EditorTableRow {
  type: "tableRow";
  blockId: string;
  cells: EditorTableCell[];
  extensions?: Record<string, JsonValue>;
}

export interface EditorTableBlock {
  type: "table";
  blockId: string;
  rows: EditorTableRow[];
  caption?: string;
  extensions?: Record<string, JsonValue>;
}

export interface EditorImageBlock {
  type: "image";
  blockId: string;
  fileId?: string;
  attachmentId?: string;
  altText: string;
  caption?: string;
  sourceCredit?: string;
  width?: number;
  height?: number;
  extensions?: Record<string, JsonValue>;
}

export interface EditorAttachmentBlock {
  type: "attachment";
  blockId: string;
  fileId?: string;
  attachmentId?: string;
  displayName: string;
  caption?: string;
  sourceCredit?: string;
  extensions?: Record<string, JsonValue>;
}

export interface EditorFileReferenceBlock {
  type: "fileRef";
  blockId: string;
  fileId?: string;
  attachmentId?: string;
  label?: string;
  extensions?: Record<string, JsonValue>;
}

export type EditorBlock =
  | EditorParagraphBlock
  | EditorHeadingBlock
  | EditorBlockquoteBlock
  | EditorBulletListBlock
  | EditorOrderedListBlock
  | EditorTableBlock
  | EditorImageBlock
  | EditorAttachmentBlock
  | EditorFileReferenceBlock;

export type EditorNode =
  | EditorInlineNode
  | EditorListItem
  | EditorTableRow
  | EditorTableCell
  | EditorBlock;

const inlineNodeSchema = z.discriminatedUnion("type", [
  z
    .object({
      ...editorNodeBaseShape,
      type: z.literal("text"),
      text: z.string().max(100_000),
      marks: z
        .array(z.enum(["bold", "italic", "underline", "code"]))
        .max(4)
        .optional(),
    })
    .strict(),
  z
    .object({
      ...editorNodeBaseShape,
      type: z.literal("hardBreak"),
    })
    .strict(),
]);

export const editorInlineNodeSchema = safeJsonSchema(inlineNodeSchema);

const headingLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

const editorBlockNodeSchema: z.ZodType<EditorBlock> = z.lazy(() => {
  const listItemSchema = z
    .object({
      ...editorNodeBaseShape,
      type: z.literal("listItem"),
      content: z.array(editorBlockNodeSchema).min(1),
    })
    .strict();

  const tableCellSchema = z
    .object({
      ...editorNodeBaseShape,
      type: z.literal("tableCell"),
      content: z.array(editorBlockNodeSchema),
      header: z.boolean().optional(),
    })
    .strict();

  const tableRowSchema = z
    .object({
      ...editorNodeBaseShape,
      type: z.literal("tableRow"),
      cells: z.array(tableCellSchema).min(1),
    })
    .strict();

  const fileReferenceShape = {
    ...editorNodeBaseShape,
    fileId: fileReferenceIdSchema.optional(),
    attachmentId: fileReferenceIdSchema.optional(),
  };
  const fileReferenceRefinement = (
    reference: { fileId?: string; attachmentId?: string },
    context: z.RefinementCtx,
  ) => {
    const hasFileId = reference.fileId !== undefined;
    const hasAttachmentId = reference.attachmentId !== undefined;
    if (hasFileId === hasAttachmentId) {
      context.addIssue({
        code: "custom",
        message: "Informe exatamente um de fileId ou attachmentId.",
        path: ["fileId"],
      });
    }
  };

  return z.discriminatedUnion("type", [
    z
      .object({
        ...editorNodeBaseShape,
        type: z.literal("paragraph"),
        content: z.array(inlineNodeSchema),
      })
      .strict(),
    z
      .object({
        ...editorNodeBaseShape,
        type: z.literal("heading"),
        level: headingLevelSchema,
        content: z.array(inlineNodeSchema).min(1),
      })
      .strict(),
    z
      .object({
        ...editorNodeBaseShape,
        type: z.literal("blockquote"),
        content: z.array(editorBlockNodeSchema).min(1),
        citation: z.string().max(10_000).optional(),
      })
      .strict(),
    z
      .object({
        ...editorNodeBaseShape,
        type: z.literal("bulletList"),
        items: z.array(listItemSchema).min(1),
      })
      .strict(),
    z
      .object({
        ...editorNodeBaseShape,
        type: z.literal("orderedList"),
        startAt: z.number().int().min(1),
        items: z.array(listItemSchema).min(1),
      })
      .strict(),
    z
      .object({
        ...editorNodeBaseShape,
        type: z.literal("table"),
        rows: z.array(tableRowSchema).min(1),
        caption: z.string().max(10_000).optional(),
      })
      .strict(),
    z
      .object({
        ...fileReferenceShape,
        type: z.literal("image"),
        altText: nonEmptyTextSchema,
        caption: z.string().max(10_000).optional(),
        sourceCredit: z.string().max(10_000).optional(),
        width: z.number().finite().positive().optional(),
        height: z.number().finite().positive().optional(),
      })
      .strict()
      .superRefine(fileReferenceRefinement),
    z
      .object({
        ...fileReferenceShape,
        type: z.literal("attachment"),
        displayName: nonEmptyTextSchema,
        caption: z.string().max(10_000).optional(),
        sourceCredit: z.string().max(10_000).optional(),
      })
      .strict()
      .superRefine(fileReferenceRefinement),
    z
      .object({
        ...fileReferenceShape,
        type: z.literal("fileRef"),
        label: z.string().max(1_000).optional(),
      })
      .strict()
      .superRefine(fileReferenceRefinement),
  ]);
});

export const editorBlockSchema = safeJsonSchema(editorBlockNodeSchema);

const MAX_EDITOR_DOCUMENT_CHARACTERS = 1_000_000;

export const editorDocumentSchema = safeJsonSchema(
  z
    .object({
      schemaVersion: z.literal(1),
      documentId: fileReferenceIdSchema,
      title: z.string().max(1_000).optional(),
      blocks: z.array(editorBlockNodeSchema),
      extensions: extensionsSchema.optional(),
    })
    .strict()
    .superRefine((document, context) => {
      if (JSON.stringify(document).length > MAX_EDITOR_DOCUMENT_CHARACTERS) {
        context.addIssue({
          code: "custom",
          message: `O documento excede ${MAX_EDITOR_DOCUMENT_CHARACTERS} caracteres serializados.`,
        });
      }
    }),
);

export type EditorDocument = z.infer<typeof editorDocumentSchema>;
export type EditorBlockIdFactory = (context: {
  documentId: string;
  path: string;
  type: EditorNode["type"];
}) => string;

export type EditorIntegrityIssueCode =
  | "DUPLICATE_BLOCK_ID"
  | "NON_RECTANGULAR_TABLE";

export interface EditorIntegrityIssue {
  code: EditorIntegrityIssueCode;
  path: string;
  message: string;
}

export class EditorDocumentIntegrityError extends Error {
  constructor(readonly issues: EditorIntegrityIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
    this.name = "EditorDocumentIntegrityError";
  }
}

function visitEditorNodes(
  nodes: EditorNode[],
  visit: (node: EditorNode, path: string) => void,
  path: string,
): void {
  nodes.forEach((node, index) => {
    const nodePath = `${path}[${index}]`;
    visit(node, nodePath);
    switch (node.type) {
      case "text":
      case "hardBreak":
      case "image":
      case "attachment":
      case "fileRef":
        return;
      case "paragraph":
      case "heading":
        visitEditorNodes(node.content, visit, `${nodePath}.content`);
        return;
      case "blockquote":
        visitEditorNodes(node.content, visit, `${nodePath}.content`);
        return;
      case "bulletList":
      case "orderedList":
        visitEditorNodes(node.items, visit, `${nodePath}.items`);
        return;
      case "listItem":
        visitEditorNodes(node.content, visit, `${nodePath}.content`);
        return;
      case "table":
        visitEditorNodes(node.rows, visit, `${nodePath}.rows`);
        return;
      case "tableRow":
        visitEditorNodes(node.cells, visit, `${nodePath}.cells`);
        return;
      case "tableCell":
        visitEditorNodes(node.content, visit, `${nodePath}.content`);
        return;
      default: {
        const unsupported: never = node;
        throw new TypeError(
          `Tipo de nó não suportado: ${String(unsupported)}`,
        );
      }
    }
  });
}

function getIntegrityIssues(document: EditorDocument): EditorIntegrityIssue[] {
  const issues: EditorIntegrityIssue[] = [];
  const seenBlockIds = new Set<string>();

  visitEditorNodes(
    document.blocks,
    (node, path) => {
      if (seenBlockIds.has(node.blockId)) {
        issues.push({
          code: "DUPLICATE_BLOCK_ID",
          path: `${path}.blockId`,
          message: `O blockId "${node.blockId}" está duplicado.`,
        });
      }
      seenBlockIds.add(node.blockId);

      if (node.type === "table") {
        const columnCount = node.rows[0].cells.length;
        node.rows.forEach((row, rowIndex) => {
          if (row.cells.length !== columnCount) {
            issues.push({
              code: "NON_RECTANGULAR_TABLE",
              path: `${path}.rows[${rowIndex}].cells`,
              message: "Todas as linhas da tabela devem ter o mesmo número de células.",
            });
          }
        });
      }
    },
    "blocks",
  );
  return issues;
}

export function parseEditorDocument(input: unknown): EditorDocument {
  return editorDocumentSchema.parse(cloneSafeJsonValue(input));
}

export function validateEditorDocumentIntegrity(
  input: unknown,
): EditorDocument {
  const document = parseEditorDocument(input);
  const issues = getIntegrityIssues(document);
  if (issues.length > 0) throw new EditorDocumentIntegrityError(issues);
  return document;
}

const EDITABLE_NODE_TYPES = new Set<EditorNode["type"]>([
  "text",
  "hardBreak",
  "paragraph",
  "heading",
  "blockquote",
  "listItem",
  "bulletList",
  "orderedList",
  "table",
  "tableRow",
  "tableCell",
  "image",
  "attachment",
  "fileRef",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeNodeIds(
  nodes: unknown,
  documentId: string,
  path: string,
  createBlockId?: EditorBlockIdFactory,
): void {
  if (!Array.isArray(nodes)) return;

  nodes.forEach((candidate, index) => {
    if (!isRecord(candidate)) return;
    const nodePath = `${path}[${index}]`;
    const type = candidate.type;

    if (typeof type === "string" && EDITABLE_NODE_TYPES.has(type as EditorNode["type"])) {
      if (!Object.hasOwn(candidate, "blockId")) {
        if (!createBlockId) {
          throw new TypeError(
            `O nó ${nodePath} não possui blockId; informe uma fábrica determinística.`,
          );
        }
        const blockId = createBlockId({
          documentId,
          path: nodePath,
          type: type as EditorNode["type"],
        });
        if (!blockIdSchema.safeParse(blockId).success) {
          throw new TypeError(`A fábrica retornou blockId inválido em ${nodePath}.`);
        }
        candidate.blockId = blockId;
      } else if (!blockIdSchema.safeParse(candidate.blockId).success) {
        throw new TypeError(`blockId inválido em ${nodePath}.`);
      }
    }

    switch (type) {
      case "paragraph":
      case "heading":
        normalizeNodeIds(
          candidate.content,
          documentId,
          `${nodePath}.content`,
          createBlockId,
        );
        return;
      case "blockquote":
        normalizeNodeIds(
          candidate.content,
          documentId,
          `${nodePath}.content`,
          createBlockId,
        );
        return;
      case "bulletList":
      case "orderedList":
        normalizeNodeIds(
          candidate.items,
          documentId,
          `${nodePath}.items`,
          createBlockId,
        );
        return;
      case "listItem":
        normalizeNodeIds(
          candidate.content,
          documentId,
          `${nodePath}.content`,
          createBlockId,
        );
        return;
      case "table":
        normalizeNodeIds(
          candidate.rows,
          documentId,
          `${nodePath}.rows`,
          createBlockId,
        );
        return;
      case "tableRow":
        normalizeNodeIds(
          candidate.cells,
          documentId,
          `${nodePath}.cells`,
          createBlockId,
        );
        return;
      case "tableCell":
        normalizeNodeIds(
          candidate.content,
          documentId,
          `${nodePath}.content`,
          createBlockId,
        );
        return;
      default:
        return;
    }
  });
}

export function normalizeEditorDocument(
  input: unknown,
  createBlockId?: EditorBlockIdFactory,
): EditorDocument {
  const copy = cloneSafeJsonValue(input);
  if (!isRecord(copy)) {
    throw new TypeError("O documento do editor deve ser um objeto JSON.");
  }
  const documentId = fileReferenceIdSchema.parse(copy.documentId);
  normalizeNodeIds(copy.blocks, documentId, "blocks", createBlockId);
  return validateEditorDocumentIntegrity(copy);
}

export interface EditorBlockReference {
  blockId: string;
  type: EditorNode["type"];
  path: string;
}

export interface EditorFileReference {
  blockId: string;
  type: "image" | "attachment" | "fileRef";
  fileId?: string;
  attachmentId?: string;
  altText?: string;
  caption?: string;
  sourceCredit?: string;
  displayName?: string;
  label?: string;
  width?: number;
  height?: number;
}

export function extractEditorBlockReferences(
  input: unknown,
): EditorBlockReference[] {
  const document = validateEditorDocumentIntegrity(input);
  const references: EditorBlockReference[] = [];
  visitEditorNodes(
    document.blocks,
    (node, path) =>
      references.push({ blockId: node.blockId, type: node.type, path }),
    "blocks",
  );
  return references;
}

export function extractEditorFileReferences(
  input: unknown,
): EditorFileReference[] {
  const document = validateEditorDocumentIntegrity(input);
  const references: EditorFileReference[] = [];
  visitEditorNodes(
    document.blocks,
    (node) => {
      if (
        node.type === "image" ||
        node.type === "attachment" ||
        node.type === "fileRef"
      ) {
        references.push({
          blockId: node.blockId,
          type: node.type,
          ...(node.fileId === undefined ? {} : { fileId: node.fileId }),
          ...(node.attachmentId === undefined
            ? {}
            : { attachmentId: node.attachmentId }),
          ...("altText" in node ? { altText: node.altText } : {}),
          ...("caption" in node && node.caption !== undefined
            ? { caption: node.caption }
            : {}),
          ...("sourceCredit" in node && node.sourceCredit !== undefined
            ? { sourceCredit: node.sourceCredit }
            : {}),
          ...("displayName" in node ? { displayName: node.displayName } : {}),
          ...("label" in node && node.label !== undefined
            ? { label: node.label }
            : {}),
          ...("width" in node && node.width !== undefined
            ? { width: node.width }
            : {}),
          ...("height" in node && node.height !== undefined
            ? { height: node.height }
            : {}),
        });
      }
    },
    "blocks",
  );
  return references;
}
