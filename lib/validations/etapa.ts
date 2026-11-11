import { z } from "zod";

export const STATUS_ETAPA = ["pendente", "em_andamento", "concluida"] as const;
export const CANAL_LEMBRETE = ["email", "google_agenda", "ambos"] as const;

export const statusEtapaSchema = z.enum(STATUS_ETAPA);
export const canalLembreteSchema = z.enum(CANAL_LEMBRETE);

const etapaBaseSchema = z.object({
  faseId: z.string().min(1, "faseId é obrigatório"),
  ordem: z.number().int().min(0),
  titulo: z.string().min(3, "título muito curto").max(200),
  objetivo: z.string().min(10, "objetivo muito curto").max(1000),
  entregaveis: z.array(z.string().min(1)).min(1, "pelo menos 1 entregável"),
  dod: z.array(z.string().min(1)).min(1, "pelo menos 1 critério de pronto"),
  inicio: z.coerce.date(),
  fim: z.coerce.date(),
  status: statusEtapaSchema.default("pendente"),
  progresso: z.number().int().min(0).max(100).default(0),
  specKit: z.string().max(200).nullable().optional(),
});

// No CREATE, ambos inicio e fim são obrigatórios — então o refine sempre roda.
export const criarEtapaSchema = etapaBaseSchema.refine(
  (data) => data.fim >= data.inicio,
  { message: "fim deve ser igual ou posterior a inicio", path: ["fim"] }
);

// No UPDATE, os campos são opcionais. O refine só roda quando ambos estão presentes.
// A rota PATCH é responsável por mesclar com os valores atuais do banco antes de gravar.
export const atualizarEtapaSchema = etapaBaseSchema
  .partial()
  .extend({
    progresso: z.number().int().min(0).max(100).optional(),
  })
  .refine(
    (data) => {
      if (data.inicio === undefined || data.fim === undefined) return true;
      return data.fim >= data.inicio;
    },
    { message: "fim deve ser igual ou posterior a inicio", path: ["fim"] }
  );

export const listarEtapasQuerySchema = z.object({
  faseId: z.string().optional(),
  status: statusEtapaSchema.optional(),
});

export type CriarEtapaInput = z.infer<typeof criarEtapaSchema>;
export type AtualizarEtapaInput = z.infer<typeof atualizarEtapaSchema>;
export type ListarEtapasQuery = z.infer<typeof listarEtapasQuerySchema>;