import { z } from "zod";

export const registroSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  senha: z.string().min(8).max(128),
});

export type RegistroInput = z.infer<typeof registroSchema>;
