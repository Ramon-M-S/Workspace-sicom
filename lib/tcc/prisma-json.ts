import type { Prisma } from "../generated/prisma/client";
import { cloneSafeJsonValue } from "./safe-json";

export function toPrismaJsonObject(value: unknown): Prisma.InputJsonObject {
  const clone = cloneSafeJsonValue(value);
  if (clone === null || typeof clone !== "object" || Array.isArray(clone)) {
    throw new TypeError("O valor persistido deve ser um objeto JSON.");
  }
  return clone as Prisma.InputJsonObject;
}
