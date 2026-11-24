import { z } from "zod";

const dataCronogramaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "A data deve estar no formato YYYY-MM-DD.")
  .refine((valor) => {
    const data = new Date(`${valor}T00:00:00.000Z`);
    return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
  }, "Informe uma data válida.")
  .pipe(z.coerce.date());

const etapaImportacaoSchema = z
  .object({
    titulo: z.string().trim().min(1, "O título é obrigatório."),
    objetivo: z.string().trim(),
    inicio: dataCronogramaSchema,
    fim: dataCronogramaSchema,
    status: z.enum(["pendente", "em_andamento", "concluida"]).default("pendente"),
    entregaveis: z.array(z.string()),
    dod: z.array(z.string()),
  })
  .refine((etapa) => etapa.fim >= etapa.inicio, {
    message: "A data final deve ser igual ou posterior à data inicial.",
    path: ["fim"],
  });

export const importarCronogramaSchema = z.object({
  fases: z.array(
    z.object({
      nome: z.string().trim().min(1, "O nome da fase é obrigatório."),
      etapas: z.array(etapaImportacaoSchema),
    }),
  ),
});

export type ImportarCronogramaInput = z.infer<typeof importarCronogramaSchema>;
