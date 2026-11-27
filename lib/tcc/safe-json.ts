import { z } from "zod";

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const MAX_DEPTH = 64;
const MAX_NODES = 20_000;

export function isForbiddenPropertyName(name: string): boolean {
  return FORBIDDEN_KEYS.has(name);
}

export function safeJsonSchema<T extends z.ZodTypeAny>(
  schema: T,
): z.ZodType<z.output<T>> {
  return z.preprocess(
    (input, context) => {
      try {
        assertSafeJsonValue(input);
      } catch (error) {
        context.addIssue({
          code: "custom",
          message:
            error instanceof Error
              ? error.message
              : "Valor JSON não seguro.",
        });
        return z.NEVER;
      }
      return input;
    },
    schema,
  ) as z.ZodType<z.output<T>>;
}

export function assertSafeJsonValue(value: unknown): void {
  const ancestors = new WeakSet<object>();
  const state = { nodes: 0 };

  function visit(current: unknown, path: string, depth: number): void {
    state.nodes += 1;
    if (state.nodes > MAX_NODES) {
      throw new TypeError(`JSON excede o limite de ${MAX_NODES} valores em ${path}.`);
    }
    if (depth > MAX_DEPTH) {
      throw new TypeError(`JSON excede a profundidade máxima em ${path}.`);
    }

    if (
      current === null ||
      typeof current === "string" ||
      typeof current === "boolean"
    ) {
      return;
    }
    if (typeof current === "number") {
      if (!Number.isFinite(current)) {
        throw new TypeError(`Número não finito em ${path}.`);
      }
      return;
    }
    if (typeof current !== "object") {
      throw new TypeError(`Valor não JSON em ${path}.`);
    }
    if (ancestors.has(current)) {
      throw new TypeError(`Referência circular não permitida em ${path}.`);
    }
    ancestors.add(current);

    if (Array.isArray(current)) {
      if (Object.getPrototypeOf(current) !== Array.prototype) {
        throw new TypeError(`Array com protótipo não permitido em ${path}.`);
      }
      if (Object.getOwnPropertySymbols(current).length > 0) {
        throw new TypeError(`Propriedades Symbol não permitidas em ${path}.`);
      }

      const descriptors = Object.getOwnPropertyDescriptors(current);
      let itemCount = 0;
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (key === "length") continue;
        const index = Number(key);
        if (
          !Number.isInteger(index) ||
          index < 0 ||
          String(index) !== key ||
          index >= current.length
        ) {
          throw new TypeError(`Propriedade extra não permitida em ${path}.${key}.`);
        }
        if (!descriptor.enumerable || !("value" in descriptor)) {
          throw new TypeError(`Acessor não permitido em ${path}[${key}].`);
        }
        itemCount += 1;
        visit(descriptor.value, `${path}[${key}]`, depth + 1);
      }
      if (itemCount !== current.length) {
        throw new TypeError(`Array esparso não permitido em ${path}.`);
      }
    } else {
      const prototype = Object.getPrototypeOf(current);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new TypeError(`Objeto com protótipo não permitido em ${path}.`);
      }
      if (Object.getOwnPropertySymbols(current).length > 0) {
        throw new TypeError(`Propriedades Symbol não permitidas em ${path}.`);
      }

      const descriptors = Object.getOwnPropertyDescriptors(current);
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (isForbiddenPropertyName(key)) {
          throw new TypeError(`Propriedade perigosa não permitida em ${path}.${key}.`);
        }
        if (!descriptor.enumerable || !("value" in descriptor)) {
          throw new TypeError(`Acessor não permitido em ${path}.${key}.`);
        }
        visit(descriptor.value, `${path}.${key}`, depth + 1);
      }
    }

    ancestors.delete(current);
  }

  visit(value, "$", 0);
}

export function cloneSafeJsonValue(value: unknown): unknown {
  assertSafeJsonValue(value);

  function clone(current: unknown): unknown {
    if (current === null || typeof current !== "object") return current;
    if (Array.isArray(current)) return current.map(clone);

    const copy: Record<string, unknown> = Object.create(null);
    for (const key of Object.keys(current)) {
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (descriptor && "value" in descriptor) {
        copy[key] = clone(descriptor.value);
      }
    }
    return copy;
  }

  return clone(value);
}
