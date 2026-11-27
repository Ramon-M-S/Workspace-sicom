import type {
  AutomaticBlock,
  InstitutionalModelDefinition,
  ModelFormatting,
  SectionDefinition,
  StyleDefinition,
} from "./model-definition.schema";
import {
  parseInstitutionalModelDefinition,
} from "./model-definition.schema";
import {
  parseModelRenderData,
  readAllowedModelDataPath,
  type ModelRenderData,
} from "./model-data";
import { evaluateCondition } from "./condition-evaluator";
import { assertModelDefinitionSemantics } from "./semantic-validation";

export interface ResolvedTextStyle {
  fontFamily: string;
  fontSizePt: number;
  fontWeight: number;
  lineHeight: number;
  fontStyle: "normal" | "italic";
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  alignment: "left" | "center" | "right" | "justify";
}

interface RenderedNodeBase {
  id: string;
  order: number;
  style: ResolvedTextStyle;
  spacing?: { beforePt?: number; afterPt?: number };
}

export type RenderedBlock =
  | (RenderedNodeBase & { kind: "text"; value: string })
  | (RenderedNodeBase & { kind: "field"; value: string | number })
  | (RenderedNodeBase & {
      kind: "list";
      values: Array<string | number>;
      separator: string;
    })
  | (RenderedNodeBase & { kind: "spacer" });

export interface RenderedAutomaticElement {
  kind: "automatic-element";
  key: string;
  title?: string;
  order: number;
  children: RenderedBlock[];
}

export interface RenderedSection {
  kind: "section";
  key: string;
  title: string;
  category: string;
  mode: SectionDefinition["mode"];
  required: boolean;
  numbered: boolean;
  order: number;
  style: ResolvedTextStyle;
  spacing?: { beforePt?: number; afterPt?: number };
  content?: string;
  children: RenderedSection[];
}

export interface ComposedInstitutionalModel {
  schemaVersion: number;
  modelName: string;
  version: number;
  formatting: ModelFormatting;
  automaticElements: RenderedAutomaticElement[];
  sections: RenderedSection[];
}

type StyleReference = Pick<
  SectionDefinition,
  "style" | "typography" | "spacingToken" | "spacing"
> & { alignment?: ResolvedTextStyle["alignment"] };

function resolveStyle(
  formatting: ModelFormatting,
  reference: StyleReference,
): ResolvedTextStyle {
  const namedStyle = reference.style
    ? formatting.styles[reference.style]
    : undefined;
  const inlineStyle: StyleDefinition = reference.typography ?? {};
  return {
    fontFamily:
      inlineStyle.fontFamily ??
      namedStyle?.fontFamily ??
      formatting.typography.fontFamily,
    fontSizePt:
      inlineStyle.fontSizePt ??
      namedStyle?.fontSizePt ??
      formatting.typography.sizes.body ??
      formatting.typography.bodySizePt,
    fontWeight: inlineStyle.fontWeight ?? namedStyle?.fontWeight ?? 400,
    lineHeight:
      inlineStyle.lineHeight ??
      namedStyle?.lineHeight ??
      formatting.typography.lineHeight,
    fontStyle: inlineStyle.fontStyle ?? namedStyle?.fontStyle ?? "normal",
    textTransform:
      inlineStyle.textTransform ?? namedStyle?.textTransform ?? "none",
    alignment:
      reference.alignment ??
      inlineStyle.alignment ??
      namedStyle?.alignment ??
      formatting.alignment,
  };
}

function resolveSpacing(
  formatting: ModelFormatting,
  reference: Pick<StyleReference, "spacingToken" | "spacing">,
): { beforePt?: number; afterPt?: number } | undefined {
  const token = reference.spacingToken
    ? formatting.spacing[reference.spacingToken]
    : undefined;
  if (!token && !reference.spacing) return undefined;
  return { ...token, ...reference.spacing };
}

function orderBy<T extends { order: number }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (left, right) =>
        left.item.order - right.item.order || left.index - right.index,
    )
    .map(({ item }) => item);
}

function assertSectionDataMatchesDefinition(
  definition: InstitutionalModelDefinition,
  data: ModelRenderData,
): Map<string, ModelRenderData["sections"][number]> {
  const configuredKeys = new Set<string>();
  const collect = (sections: SectionDefinition[]) => {
    for (const section of sections) {
      configuredKeys.add(section.key);
      collect(section.subsections);
    }
  };
  collect(definition.sections);

  const result = new Map<string, ModelRenderData["sections"][number]>();
  for (const section of data.sections) {
    if (result.has(section.key)) {
      throw new Error(`A seção de dados "${section.key}" está duplicada.`);
    }
    if (!configuredKeys.has(section.key)) {
      throw new Error(`A seção de dados "${section.key}" não existe no modelo.`);
    }
    result.set(section.key, section);
  }
  return result;
}

function renderBlock(
  block: AutomaticBlock,
  definition: InstitutionalModelDefinition,
  data: ModelRenderData,
): RenderedBlock | undefined {
  if (block.when && !evaluateCondition(block.when, data)) return undefined;
  const base = {
    id: block.id,
    order: block.order,
    style: resolveStyle(definition.formatting, block),
    spacing: resolveSpacing(definition.formatting, block),
  };

  switch (block.type) {
    case "text":
      return { ...base, kind: "text", value: block.text };
    case "field": {
      const value = readAllowedModelDataPath(data, block.field);
      if (!value.found) {
        throw new Error(
          `O campo "${block.field}" não possui valor para o bloco "${block.id}".`,
        );
      }
      if (typeof value.value === "string" || typeof value.value === "number") {
        return { ...base, kind: "field", value: value.value };
      }
      throw new TypeError(
        `O campo "${block.field}" não é um valor renderizável.`,
      );
    }
    case "list": {
      const result = readAllowedModelDataPath(data, block.itemField);
      if (!result.found || !Array.isArray(result.value)) {
        throw new Error(
          `A lista "${block.itemField}" não está disponível para o bloco "${block.id}".`,
        );
      }
      const values = result.value.filter(
        (value): value is string | number =>
          (typeof value === "string" && value.trim().length > 0) ||
          typeof value === "number",
      );
      return {
        ...base,
        kind: "list",
        values,
        separator: block.separator ?? ", ",
      };
    }
    case "spacer":
      return { ...base, kind: "spacer" };
    default: {
      const unsupported = block as { type?: unknown };
      throw new TypeError(
        `Tipo de bloco não suportado: ${String(unsupported.type)}`,
      );
    }
  }
}

function renderSection(
  section: SectionDefinition,
  dataByKey: Map<string, ModelRenderData["sections"][number]>,
  formatting: ModelFormatting,
): RenderedSection {
  const dataSection = dataByKey.get(section.key);
  return {
    kind: "section",
    key: section.key,
    title: section.title,
    category: section.category,
    mode: section.mode,
    required: section.required,
    numbered: section.numbered,
    order: section.order,
    style: resolveStyle(formatting, section),
    spacing: resolveSpacing(formatting, section),
    ...(dataSection?.content === undefined
      ? {}
      : { content: dataSection.content }),
    children: orderBy(section.subsections).map((child) =>
      renderSection(child, dataByKey, formatting),
    ),
  };
}

export function composeInstitutionalModel(
  modelInput: unknown,
  dataInput: unknown,
): ComposedInstitutionalModel {
  const definition = parseInstitutionalModelDefinition(modelInput);
  assertModelDefinitionSemantics(definition);
  const data = parseModelRenderData(dataInput);
  const dataByKey = assertSectionDataMatchesDefinition(definition, data);

  const automaticElements = orderBy(definition.automaticElements)
    .filter((element) => !element.when || evaluateCondition(element.when, data))
    .map((element) => ({
      kind: "automatic-element" as const,
      key: element.key,
      ...(element.title === undefined ? {} : { title: element.title }),
      order: element.order,
      children: orderBy(element.blocks)
        .map((block) => renderBlock(block, definition, data))
        .filter((node): node is RenderedBlock => node !== undefined),
    }));

  return {
    schemaVersion: definition.schemaVersion,
    modelName: definition.name,
    version: definition.version,
    formatting: definition.formatting,
    automaticElements,
    sections: orderBy(definition.sections).map((section) =>
      renderSection(section, dataByKey, definition.formatting),
    ),
  };
}
