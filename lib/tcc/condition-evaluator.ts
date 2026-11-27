import {
  conditionSchema,
  type Condition,
} from "./model-definition.schema";
import { readAllowedModelDataPath } from "./model-data";
import { cloneSafeJsonValue } from "./safe-json";

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasValue);
  return true;
}

function compareNumbers(
  left: number,
  comparator: "gt" | "gte" | "lt" | "lte",
  right: number,
): boolean {
  switch (comparator) {
    case "gt":
      return left > right;
    case "gte":
      return left >= right;
    case "lt":
      return left < right;
    case "lte":
      return left <= right;
    default: {
      const unsupported: never = comparator;
      throw new TypeError(`Comparador não suportado: ${String(unsupported)}`);
    }
  }
}

function evaluateConditionNode(condition: Condition, data: unknown): boolean {
  switch (condition.op) {
    case "exists": {
      const result = readAllowedModelDataPath(data, condition.path);
      return result.found && hasValue(result.value);
    }
    case "equals": {
      const result = readAllowedModelDataPath(data, condition.path);
      return (
        result.found &&
        !Array.isArray(result.value) &&
        Object.is(result.value, condition.value)
      );
    }
    case "compare": {
      const result = readAllowedModelDataPath(data, condition.path);
      return (
        result.found &&
        typeof result.value === "number" &&
        compareNumbers(result.value, condition.comparator, condition.value)
      );
    }
    case "collectionLength": {
      const result = readAllowedModelDataPath(data, condition.path);
      return (
        result.found &&
        Array.isArray(result.value) &&
        compareNumbers(
          result.value.length,
          condition.comparator,
          condition.value,
        )
      );
    }
    case "all":
      return condition.conditions.every((child) =>
        evaluateConditionNode(child, data),
      );
    case "any":
      return condition.conditions.some((child) =>
        evaluateConditionNode(child, data),
      );
    case "not":
      return !evaluateConditionNode(condition.condition, data);
    default: {
      const unsupported = condition as { op?: unknown };
      throw new TypeError(
        `Operador de condição não suportado: ${String(unsupported.op)}`,
      );
    }
  }
}

export function evaluateCondition(condition: Condition, data: unknown): boolean {
  const parsedCondition = conditionSchema.safeParse(condition);
  if (!parsedCondition.success) {
    throw new TypeError("Condição declarativa inválida.");
  }
  const safeData = cloneSafeJsonValue(data);
  return evaluateConditionNode(parsedCondition.data, safeData);
}
