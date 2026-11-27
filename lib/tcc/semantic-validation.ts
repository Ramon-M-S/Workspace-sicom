import type {
  AutomaticBlock,
  Condition,
  InstitutionalModelDefinition,
  SectionDefinition,
} from "./model-definition.schema";
import {
  getCollectionPath,
  getModelDataValueType,
  isAllowedModelDataPath,
  type AllowedModelDataPath,
} from "./model-data";
import { assertSafeJsonValue, isForbiddenPropertyName } from "./safe-json";

export interface ModelDefinitionIssue {
  code:
    | "DANGEROUS_DATA_PATH"
    | "UNKNOWN_DATA_PATH"
    | "INVALID_CONDITION_TYPE"
    | "UNKNOWN_STYLE"
    | "UNKNOWN_SPACING_TOKEN"
    | "INVALID_LIST_REFERENCE"
    | "DUPLICATE_SECTION_KEY"
    | "DUPLICATE_ELEMENT_KEY"
    | "DUPLICATE_BLOCK_ID"
    | "INVALID_PAGE_DIMENSIONS"
    | "INVALID_NUMBERING_CONFIGURATION";
  path: string;
  message: string;
}

export class ModelDefinitionSemanticError extends Error {
  constructor(readonly issues: ModelDefinitionIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
    this.name = "ModelDefinitionSemanticError";
  }
}

function isScalarPath(path: string): path is AllowedModelDataPath {
  return (
    isAllowedModelDataPath(path) &&
    getModelDataValueType(path) !== "collection" &&
    getModelDataValueType(path) !== "string-collection" &&
    getCollectionPath(path) === undefined
  );
}

function validatePath(
  path: string,
  location: string,
  issues: ModelDefinitionIssue[],
): void {
  const segments = path.split(/[.[\]]+/).filter(Boolean);
  if (segments.some(isForbiddenPropertyName)) {
    issues.push({
      code: "DANGEROUS_DATA_PATH",
      path: location,
      message: `O caminho "${path}" contém uma propriedade perigosa.`,
    });
    return;
  }
  if (!isAllowedModelDataPath(path)) {
    issues.push({
      code: "UNKNOWN_DATA_PATH",
      path: location,
      message: `O caminho "${path}" não está no registro de propriedades permitido.`,
    });
  }
}

function validateCondition(
  condition: Condition,
  location: string,
  issues: ModelDefinitionIssue[],
): void {
  switch (condition.op) {
    case "exists":
      validatePath(condition.path, location, issues);
      return;
    case "equals": {
      validatePath(condition.path, location, issues);
      if (!isAllowedModelDataPath(condition.path)) return;
      if (!isScalarPath(condition.path)) {
        issues.push({
          code: "INVALID_CONDITION_TYPE",
          path: location,
          message: `equals exige um valor escalar; "${condition.path}" não é escalar.`,
        });
        return;
      }
      const pathType = getModelDataValueType(condition.path);
      const valueType = typeof condition.value;
      const compatible =
        pathType === "string-or-number"
          ? valueType === "string" || valueType === "number"
          : pathType === valueType;
      if (!compatible) {
        issues.push({
          code: "INVALID_CONDITION_TYPE",
          path: location,
          message: `O valor de equals não corresponde ao tipo de "${condition.path}".`,
        });
      }
      return;
    }
    case "compare": {
      validatePath(condition.path, location, issues);
      if (!isAllowedModelDataPath(condition.path)) return;
      if (!isScalarPath(condition.path)) {
        issues.push({
          code: "INVALID_CONDITION_TYPE",
          path: location,
          message: `compare exige um valor escalar; "${condition.path}" não é escalar.`,
        });
        return;
      }
      const pathType = getModelDataValueType(condition.path);
      if (pathType !== "number" && pathType !== "string-or-number") {
        issues.push({
          code: "INVALID_CONDITION_TYPE",
          path: location,
          message: `Comparação numérica não permitida para "${condition.path}".`,
        });
      }
      return;
    }
    case "collectionLength":
      validatePath(condition.path, location, issues);
      if (
        !isAllowedModelDataPath(condition.path) ||
        getModelDataValueType(condition.path) !== "collection"
      ) {
        issues.push({
          code: "INVALID_CONDITION_TYPE",
          path: location,
          message: `"${condition.path}" não é uma coleção registrada.`,
        });
      }
      return;
    case "all":
    case "any":
      condition.conditions.forEach((child, index) =>
        validateCondition(child, `${location}.conditions[${index}]`, issues),
      );
      return;
    case "not":
      validateCondition(condition.condition, `${location}.condition`, issues);
      return;
    default: {
      const unsupported = condition as { op?: unknown };
      throw new TypeError(
        `Operador de condição não suportado: ${String(unsupported.op)}`,
      );
    }
  }
}

function validateStyleAndSpacing(
  reference: { style?: string; spacingToken?: string },
  location: string,
  definition: InstitutionalModelDefinition,
  issues: ModelDefinitionIssue[],
): void {
  if (
    reference.style &&
    !Object.hasOwn(definition.formatting.styles, reference.style)
  ) {
    issues.push({
      code: "UNKNOWN_STYLE",
      path: location,
      message: `O estilo "${reference.style}" não foi definido.`,
    });
  }
  if (
    reference.spacingToken &&
    !Object.hasOwn(definition.formatting.spacing, reference.spacingToken)
  ) {
    issues.push({
      code: "UNKNOWN_SPACING_TOKEN",
      path: location,
      message: `O token de espaçamento "${reference.spacingToken}" não foi definido.`,
    });
  }
}

function collectSectionKeys(
  sections: SectionDefinition[],
  location: string,
  seen: Set<string>,
  definition: InstitutionalModelDefinition,
  issues: ModelDefinitionIssue[],
): void {
  sections.forEach((section, index) => {
    const sectionPath = `${location}[${index}]`;
    if (seen.has(section.key)) {
      issues.push({
        code: "DUPLICATE_SECTION_KEY",
        path: `${sectionPath}.key`,
        message: `A chave de seção "${section.key}" já foi usada.`,
      });
    }
    seen.add(section.key);
    validateStyleAndSpacing(section, sectionPath, definition, issues);
    collectSectionKeys(
      section.subsections,
      `${sectionPath}.subsections`,
      seen,
      definition,
      issues,
    );
  });
}

function validateBlock(
  block: AutomaticBlock,
  location: string,
  definition: InstitutionalModelDefinition,
  issues: ModelDefinitionIssue[],
): void {
  validateStyleAndSpacing(block, location, definition, issues);
  if (block.when) validateCondition(block.when, `${location}.when`, issues);

  switch (block.type) {
    case "text":
    case "spacer":
      return;
    case "field":
      validatePath(block.field, `${location}.field`, issues);
      if (isAllowedModelDataPath(block.field) && !isScalarPath(block.field)) {
        issues.push({
          code: "INVALID_LIST_REFERENCE",
          path: `${location}.field`,
          message: "Um bloco field deve referenciar um valor escalar.",
        });
      }
      return;
    case "list": {
      validatePath(block.itemField, `${location}.itemField`, issues);
      if (
        !isAllowedModelDataPath(block.itemField) ||
        getCollectionPath(block.itemField) !== block.source
      ) {
        issues.push({
          code: "INVALID_LIST_REFERENCE",
          path: `${location}.itemField`,
          message: `O campo deve pertencer à coleção "${block.source}".`,
        });
      }
      return;
    }
    default: {
      const unsupported = block as { type?: unknown };
      throw new TypeError(
        `Tipo de bloco não suportado: ${String(unsupported.type)}`,
      );
    }
  }
}

export function validateModelDefinitionSemantics(
  definition: InstitutionalModelDefinition,
): ModelDefinitionIssue[] {
  assertSafeJsonValue(definition);
  const issues: ModelDefinitionIssue[] = [];
  const { page, marginsMm, numbering } = definition.formatting;
  const width = page.widthMm;
  const height = page.heightMm;
  const hasWidth = width !== undefined;
  const hasHeight = height !== undefined;
  if (hasWidth !== hasHeight) {
    issues.push({
      code: "INVALID_PAGE_DIMENSIONS",
      path: "formatting.page",
      message: "As dimensões de largura e altura devem ser informadas juntas.",
    });
  } else if (hasWidth && hasHeight) {
    const orientationMatches =
      page.orientation === "portrait" ? width < height : width > height;
    if (
      !orientationMatches ||
      width <= marginsMm.left + marginsMm.right ||
      height <= marginsMm.top + marginsMm.bottom
    ) {
      issues.push({
        code: "INVALID_PAGE_DIMENSIONS",
        path: "formatting.page",
        message:
          "Dimensões, orientação e margens não deixam uma área útil válida.",
      });
    }
  }
  if (numbering.enabled && numbering.style === "none") {
    issues.push({
      code: "INVALID_NUMBERING_CONFIGURATION",
      path: "formatting.numbering",
      message: "Numeração habilitada exige um estilo de numeração.",
    });
  }
  collectSectionKeys(
    definition.sections,
    "sections",
    new Set<string>(),
    definition,
    issues,
  );

  const elementKeys = new Set<string>();
  const blockIds = new Set<string>();
  definition.automaticElements.forEach((element, elementIndex) => {
    const elementPath = `automaticElements[${elementIndex}]`;
    if (elementKeys.has(element.key)) {
      issues.push({
        code: "DUPLICATE_ELEMENT_KEY",
        path: `${elementPath}.key`,
        message: `A chave de elemento "${element.key}" já foi usada.`,
      });
    }
    elementKeys.add(element.key);
    if (element.when) {
      validateCondition(element.when, `${elementPath}.when`, issues);
    }
    element.blocks.forEach((block, blockIndex) => {
      const blockPath = `${elementPath}.blocks[${blockIndex}]`;
      if (blockIds.has(block.id)) {
        issues.push({
          code: "DUPLICATE_BLOCK_ID",
          path: `${blockPath}.id`,
          message: `O identificador de bloco "${block.id}" já foi usado.`,
        });
      }
      blockIds.add(block.id);
      validateBlock(block, blockPath, definition, issues);
    });
  });
  return issues;
}

export function assertModelDefinitionSemantics(
  definition: InstitutionalModelDefinition,
): void {
  const issues = validateModelDefinitionSemantics(definition);
  if (issues.length > 0) throw new ModelDefinitionSemanticError(issues);
}
