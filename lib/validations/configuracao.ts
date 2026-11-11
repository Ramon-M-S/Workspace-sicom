import { z } from "zod";

export const configuracaoSchema = z.object({
  nomeProjeto: z.string().min(3),
  dataInicio: z.coerce.date(),
  dataDefesa: z.coerce.date().nullable().optional(),
  emailLembrete: z.string().email().nullable().optional(),
  ativoLembretes: z.boolean(),
  diasAntecedencia: z.number().int().min(1).max(30),
});

export const atualizarConfiguracaoSchema = configuracaoSchema.partial();

export type AtualizarConfiguracaoInput = z.infer<typeof atualizarConfiguracaoSchema>;
