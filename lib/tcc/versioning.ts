import {
  parseInstitutionalModelDefinition,
  type InstitutionalModelDefinition,
  type VersionStatus,
} from "./model-definition.schema";
import { assertModelDefinitionSemantics } from "./semantic-validation";
import { cloneSafeJsonValue } from "./safe-json";

const ALLOWED_TRANSITIONS: Readonly<
  Record<VersionStatus, readonly VersionStatus[]>
> = {
  RASCUNHO: ["PUBLICADA"],
  PUBLICADA: ["ARQUIVADA"],
  ARQUIVADA: [],
};

const PROTECTED_VERSION_FIELDS = new Set([
  "modelId",
  "schemaVersion",
  "version",
  "status",
]);

export function isVersionTransitionAllowed(
  current: VersionStatus,
  next: VersionStatus,
): boolean {
  return ALLOWED_TRANSITIONS[current].includes(next);
}

export function transitionVersionStatus<T extends { status: VersionStatus }>(
  version: T,
  next: VersionStatus,
): Omit<T, "status"> & { status: VersionStatus } {
  if (!isVersionTransitionAllowed(version.status, next)) {
    throw new Error(
      `Transição de versão não permitida: ${version.status} -> ${next}.`,
    );
  }
  return { ...version, status: next };
}

export function assertVersionEditable(status: VersionStatus): void {
  if (status !== "RASCUNHO") {
    throw new Error(
      `Versões ${status} são imutáveis; crie uma nova versão para editá-las.`,
    );
  }
}

export function createNextDraftVersion(
  input: unknown,
): InstitutionalModelDefinition {
  const current = parseInstitutionalModelDefinition(input);
  assertModelDefinitionSemantics(current);
  if (current.status === "RASCUNHO") {
    throw new Error("Crie uma nova versão somente a partir de uma versão publicada ou arquivada.");
  }

  const nextVersion = {
    ...structuredClone(current),
    version: current.version + 1,
    status: "RASCUNHO" as const,
  };
  return parseInstitutionalModelDefinition(nextVersion);
}

export type DraftVersionChanges = Partial<
  Omit<
    InstitutionalModelDefinition,
    "modelId" | "schemaVersion" | "version" | "status"
  >
>;

export function updateDraftVersion(
  input: unknown,
  changes: DraftVersionChanges,
): InstitutionalModelDefinition {
  const current = parseInstitutionalModelDefinition(input);
  assertModelDefinitionSemantics(current);
  assertVersionEditable(current.status);

  if (
    changes === null ||
    typeof changes !== "object" ||
    Array.isArray(changes)
  ) {
    throw new TypeError("As alterações da versão devem ser um objeto JSON.");
  }
  const protectedFields = Object.getOwnPropertyNames(changes).filter((key) =>
    PROTECTED_VERSION_FIELDS.has(key),
  );
  if (protectedFields.length > 0) {
    throw new Error(
      `Campos protegidos não podem ser alterados: ${protectedFields.join(", ")}.`,
    );
  }

  const safeChanges = cloneSafeJsonValue(changes);
  if (
    safeChanges === null ||
    typeof safeChanges !== "object" ||
    Array.isArray(safeChanges)
  ) {
    throw new TypeError("As alterações da versão devem ser um objeto JSON.");
  }
  const updated = parseInstitutionalModelDefinition({
    ...current,
    ...safeChanges,
  });
  assertModelDefinitionSemantics(updated);
  return updated;
}

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor && "value" in descriptor) deepFreeze(descriptor.value);
    }
  }
  return value as DeepReadonly<T>;
}

export function createProjectModelSnapshot(
  input: unknown,
): DeepReadonly<InstitutionalModelDefinition> {
  const definition = parseInstitutionalModelDefinition(input);
  assertModelDefinitionSemantics(definition);
  return deepFreeze(structuredClone(definition));
}
