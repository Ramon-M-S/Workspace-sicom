import { z } from "zod";

export const criarFaseSchema = z.object({
  nome: z.string().trim().min(1, "nome é obrigatório").max(120),
  ordem: z.number().int().min(0),
});

export type CriarFaseInput = z.infer<typeof criarFaseSchema>;
