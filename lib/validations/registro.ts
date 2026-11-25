import { z } from "zod";

const vazioComoAusente = (valor: unknown) =>
  typeof valor === "string" && valor.trim() === "" ? undefined : valor;

export const registroSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  senha: z.string().min(8).max(128),
  nomeProjeto: z.preprocess(
    vazioComoAusente,
    z.string().trim().min(3).max(120).optional(),
  ),
  dataInicio: z.preprocess(vazioComoAusente, z.coerce.date().optional()),
  dataDefesa: z.preprocess(vazioComoAusente, z.coerce.date().optional()),
});

export type RegistroInput = z.infer<typeof registroSchema>;
