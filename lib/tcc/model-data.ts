import { z } from "zod";
import { modelDataPathSchema } from "./model-definition.schema";
import { cloneSafeJsonValue, safeJsonSchema } from "./safe-json";

const authorDataSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().optional(),
    role: z.string().optional(),
  })
  .strict();

const sectionDataSchema = z
  .object({
    key: z.string().min(1),
    title: z.string().min(1),
    content: z.string().optional(),
  })
  .strict();

export const modelRenderDataSchema = safeJsonSchema(
  z
    .object({
    project: z
      .object({
        title: z.string().min(1),
        subtitle: z.string().optional(),
        institution: z.string().optional(),
        program: z.string().optional(),
        city: z.string().optional(),
        year: z.union([z.string(), z.number().finite()]).optional(),
      })
      .strict(),
    authors: z.array(authorDataSchema),
    sections: z.array(sectionDataSchema),
    })
    .strict(),
);

export type ModelRenderData = z.infer<typeof modelRenderDataSchema>;
export type ModelAuthorData = z.infer<typeof authorDataSchema>;
export type ModelSectionData = z.infer<typeof sectionDataSchema>;

type DataValueType =
  | "string"
  | "number"
  | "string-or-number"
  | "collection"
  | "string-collection";

interface ModelDataProperty {
  path: readonly string[];
  type: DataValueType;
  collection?: "authors" | "sections";
}

export const MODEL_DATA_PROPERTY_REGISTRY = Object.freeze({
  "project.title": { path: ["project", "title"], type: "string" },
  "project.subtitle": { path: ["project", "subtitle"], type: "string" },
  "project.institution": { path: ["project", "institution"], type: "string" },
  "project.program": { path: ["project", "program"], type: "string" },
  "project.city": { path: ["project", "city"], type: "string" },
  "project.year": { path: ["project", "year"], type: "string-or-number" },
  authors: { path: ["authors"], type: "collection" },
  "authors[].name": {
    path: ["name"],
    type: "string-collection",
    collection: "authors",
  },
  "authors[].email": {
    path: ["email"],
    type: "string-collection",
    collection: "authors",
  },
  "authors[].role": {
    path: ["role"],
    type: "string-collection",
    collection: "authors",
  },
  sections: { path: ["sections"], type: "collection" },
  "sections[].key": {
    path: ["key"],
    type: "string-collection",
    collection: "sections",
  },
  "sections[].title": {
    path: ["title"],
    type: "string-collection",
    collection: "sections",
  },
  "sections[].content": {
    path: ["content"],
    type: "string-collection",
    collection: "sections",
  },
} satisfies Record<string, ModelDataProperty>);

export type AllowedModelDataPath = keyof typeof MODEL_DATA_PROPERTY_REGISTRY;

export function isAllowedModelDataPath(
  path: string,
): path is AllowedModelDataPath {
  return (
    modelDataPathSchema.safeParse(path).success &&
    Object.hasOwn(MODEL_DATA_PROPERTY_REGISTRY, path)
  );
}

export interface ModelDataPathResult {
  found: boolean;
  value: unknown;
}

function readOwnDataProperty(
  value: unknown,
  property: string,
): ModelDataPathResult {
  if (
    value === null ||
    (typeof value !== "object" && typeof value !== "function") ||
    !Object.hasOwn(value, property)
  ) {
    return { found: false, value: undefined };
  }

  const descriptor = Object.getOwnPropertyDescriptor(value, property);
  if (!descriptor || !("value" in descriptor)) {
    return { found: false, value: undefined };
  }
  return { found: true, value: descriptor.value };
}

export function readAllowedModelDataPath(
  data: unknown,
  path: string,
): ModelDataPathResult {
  if (!isAllowedModelDataPath(path)) {
    throw new TypeError(`Referência de dados não permitida: ${path}`);
  }

  const property = MODEL_DATA_PROPERTY_REGISTRY[path];
  if ("collection" in property) {
    const collection = readOwnDataProperty(data, property.collection);
    if (!collection.found || !Array.isArray(collection.value)) {
      return { found: false, value: undefined };
    }
    const values: unknown[] = [];
    for (const item of collection.value) {
      const itemValue = readOwnDataProperty(item, property.path[0]);
      values.push(itemValue.found ? itemValue.value : undefined);
    }
    return { found: true, value: values };
  }

  let current = data;
  for (const segment of property.path) {
    const result = readOwnDataProperty(current, segment);
    if (!result.found) return { found: false, value: undefined };
    current = result.value;
  }
  return { found: true, value: current };
}

export function parseModelRenderData(input: unknown): ModelRenderData {
  return modelRenderDataSchema.parse(cloneSafeJsonValue(input));
}

export function getModelDataValueType(path: AllowedModelDataPath): DataValueType {
  return MODEL_DATA_PROPERTY_REGISTRY[path].type;
}

export function getCollectionPath(
  path: AllowedModelDataPath,
): "authors" | "sections" | undefined {
  const property = MODEL_DATA_PROPERTY_REGISTRY[path];
  return "collection" in property ? property.collection : undefined;
}
