import { z } from "zod";

export const criarAnotacaoSchema = z.object({
  conteudo: z
    .string()
    .trim()
    .min(1, "conteúdo não pode ser vazio")
    .max(5000, "conteúdo muito longo (máx. 5000 caracteres)"),
});

export const atualizarAnotacaoSchema = criarAnotacaoSchema.partial();

export type CriarAnotacaoInput = z.infer<typeof criarAnotacaoSchema>;
export type AtualizarAnotacaoInput = z.infer<typeof atualizarAnotacaoSchema>;
