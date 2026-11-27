import { z } from "zod";
import {
  cloneSafeJsonValue,
  isForbiddenPropertyName,
  safeJsonSchema,
} from "./safe-json";

const keySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z][A-Za-z0-9_-]*$/);

const extensionKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z][A-Za-z0-9_-]*$/)
  .refine((key) => !isForbiddenPropertyName(key));

export const modelDataPathSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z][A-Za-z0-9]*(?:\[\])?(?:\.[A-Za-z][A-Za-z0-9]*(?:\[\])?)*$/);

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(extensionKeySchema, jsonValueSchema),
  ]),
);

export const extensionsSchema = z.record(extensionKeySchema, jsonValueSchema);

export const versionStatusSchema = z.enum([
  "RASCUNHO",
  "PUBLICADA",
  "ARQUIVADA",
]);
export type VersionStatus = z.infer<typeof versionStatusSchema>;

export const alignmentSchema = z.enum([
  "left",
  "center",
  "right",
  "justify",
]);
export type TextAlignment = z.infer<typeof alignmentSchema>;

const spacingSchema = z
  .object({
    beforePt: z.number().finite().min(0).optional(),
    afterPt: z.number().finite().min(0).optional(),
  })
  .strict();

export const styleDefinitionSchema = z
  .object({
    fontFamily: z.string().min(1).max(120).optional(),
    fontSizePt: z.number().finite().positive().optional(),
    fontWeight: z.number().int().min(100).max(900).optional(),
    lineHeight: z.number().finite().positive().optional(),
    fontStyle: z.enum(["normal", "italic"]).optional(),
    textTransform: z
      .enum(["none", "uppercase", "lowercase", "capitalize"])
      .optional(),
    alignment: alignmentSchema.optional(),
  })
  .strict();

export type StyleDefinition = z.infer<typeof styleDefinitionSchema>;

export const comparisonOperatorSchema = z.enum(["eq", "gt", "gte", "lt", "lte"]);
export type ComparisonOperator = z.infer<typeof comparisonOperatorSchema>;

export type Condition =
  | { op: "exists"; path: string }
  | { op: "equals"; path: string; value: string | number | boolean }
  | {
      op: "compare";
      path: string;
      comparator: Exclude<ComparisonOperator, "eq">;
      value: number;
    }
  | {
      op: "collectionLength";
      path: "authors" | "sections";
      comparator: Exclude<ComparisonOperator, "eq">;
      value: number;
    }
  | { op: "all"; conditions: Condition[] }
  | { op: "any"; conditions: Condition[] }
  | { op: "not"; condition: Condition };

const conditionNodeSchema: z.ZodType<Condition> = z.lazy(() =>
  z.discriminatedUnion("op", [
    z.object({ op: z.literal("exists"), path: modelDataPathSchema }).strict(),
    z
      .object({
        op: z.literal("equals"),
        path: modelDataPathSchema,
        value: z.union([z.string(), z.number().finite(), z.boolean()]),
      })
      .strict(),
    z
      .object({
        op: z.literal("compare"),
        path: modelDataPathSchema,
        comparator: z.enum(["gt", "gte", "lt", "lte"]),
        value: z.number().finite(),
      })
      .strict(),
    z
      .object({
        op: z.literal("collectionLength"),
        path: z.enum(["authors", "sections"]),
        comparator: z.enum(["gt", "gte", "lt", "lte"]),
        value: z.number().int().min(0),
      })
      .strict(),
    z.object({ op: z.literal("all"), conditions: z.array(conditionNodeSchema).min(1) }).strict(),
    z.object({ op: z.literal("any"), conditions: z.array(conditionNodeSchema).min(1) }).strict(),
    z.object({ op: z.literal("not"), condition: conditionNodeSchema }).strict(),
  ]),
);
export const conditionSchema: z.ZodType<Condition> =
  safeJsonSchema(conditionNodeSchema);

export const sectionModeSchema = z.enum(["manual", "automatic", "hybrid"]);
export type SectionMode = z.infer<typeof sectionModeSchema>;

export interface SectionDefinition {
  key: string;
  title: string;
  category: string;
  mode: SectionMode;
  required: boolean;
  numbered: boolean;
  order: number;
  style?: string;
  typography?: StyleDefinition;
  spacingToken?: string;
  spacing?: z.infer<typeof spacingSchema>;
  subsections: SectionDefinition[];
  extensions?: Record<string, JsonValue>;
}

const sectionDefinitionSchema: z.ZodType<SectionDefinition> = z.lazy(() =>
  z
    .object({
      key: keySchema,
      title: z.string().min(1).max(240),
      category: z.string().min(1).max(80),
      mode: sectionModeSchema,
      required: z.boolean(),
      numbered: z.boolean(),
      order: z.number().int().min(0),
      style: keySchema.optional(),
      typography: styleDefinitionSchema.optional(),
      spacingToken: keySchema.optional(),
      spacing: spacingSchema.optional(),
      subsections: z.array(sectionDefinitionSchema),
      extensions: extensionsSchema.optional(),
    })
    .strict(),
);

export const documentSectionDefinitionSchema = sectionDefinitionSchema;

const commonBlockShape = {
  id: keySchema,
  order: z.number().int().min(0),
  style: keySchema.optional(),
  typography: styleDefinitionSchema.optional(),
  alignment: alignmentSchema.optional(),
  spacingToken: keySchema.optional(),
  spacing: spacingSchema.optional(),
  when: conditionSchema.optional(),
  extensions: extensionsSchema.optional(),
};

const textBlockSchema = z
  .object({
    ...commonBlockShape,
    type: z.literal("text"),
    text: z.string().max(20_000),
  })
  .strict();

const fieldBlockSchema = z
  .object({
    ...commonBlockShape,
    type: z.literal("field"),
    field: modelDataPathSchema,
  })
  .strict();

const listBlockSchema = z
  .object({
    ...commonBlockShape,
    type: z.literal("list"),
    source: z.enum(["authors", "sections"]),
    itemField: modelDataPathSchema,
    separator: z.string().max(40).optional(),
  })
  .strict();

const spacerBlockSchema = z
  .object({
    ...commonBlockShape,
    type: z.literal("spacer"),
  })
  .strict();

export const automaticBlockSchema = z.discriminatedUnion("type", [
  textBlockSchema,
  fieldBlockSchema,
  listBlockSchema,
  spacerBlockSchema,
]);

export type AutomaticBlock = z.infer<typeof automaticBlockSchema>;

const automaticElementSchema = z
  .object({
    key: keySchema,
    title: z.string().min(1).max(240).optional(),
    order: z.number().int().min(0),
    when: conditionSchema.optional(),
    blocks: z.array(automaticBlockSchema),
    extensions: extensionsSchema.optional(),
  })
  .strict();

export const formattingSchema = z
  .object({
    page: z
      .object({
        size: z.string().min(1).max(40),
        orientation: z.enum(["portrait", "landscape"]),
        widthMm: z.number().finite().positive().optional(),
        heightMm: z.number().finite().positive().optional(),
      })
      .strict(),
    marginsMm: z
      .object({
        top: z.number().finite().min(0),
        right: z.number().finite().min(0),
        bottom: z.number().finite().min(0),
        left: z.number().finite().min(0),
      })
      .strict(),
    typography: z
      .object({
        fontFamily: z.string().min(1).max(120),
        bodySizePt: z.number().finite().positive(),
        lineHeight: z.number().finite().positive(),
        sizes: z.record(keySchema, z.number().finite().positive()),
      })
      .strict(),
    alignment: alignmentSchema,
    spacing: z.record(keySchema, spacingSchema),
    numbering: z
      .object({
        enabled: z.boolean(),
        style: z.enum(["none", "decimal", "roman-lower", "roman-upper"]),
        startAt: z.number().int().min(1),
      })
      .strict(),
    pagination: z
      .object({
        enabled: z.boolean(),
        position: z.enum(["top", "bottom"]),
        includeFirstPage: z.boolean(),
      })
      .strict(),
    styles: z.record(keySchema, styleDefinitionSchema),
    extensions: extensionsSchema.optional(),
  })
  .strict();

export type ModelFormatting = z.infer<typeof formattingSchema>;

export const institutionalModelDefinitionSchema = safeJsonSchema(
  z
    .object({
    schemaVersion: z.literal(1),
    modelId: keySchema,
    name: z.string().min(1).max(160),
    description: z.string().max(2_000).optional(),
    issuer: z.string().min(1).max(160).optional(),
    version: z.number().int().min(1),
    status: versionStatusSchema,
    formatting: formattingSchema,
    sections: z.array(sectionDefinitionSchema),
    automaticElements: z.array(automaticElementSchema),
    extensions: extensionsSchema.optional(),
    })
    .strict(),
);

export type InstitutionalModelDefinition = z.infer<
  typeof institutionalModelDefinitionSchema
>;

export function parseInstitutionalModelDefinition(
  input: unknown,
): InstitutionalModelDefinition {
  return institutionalModelDefinitionSchema.parse(cloneSafeJsonValue(input));
}
