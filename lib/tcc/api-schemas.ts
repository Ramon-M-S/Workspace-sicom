import { z } from "zod";
import { PapelMembroProjetoTcc } from "../generated/prisma/enums";
import {
  institutionalModelDefinitionSchema,
  versionStatusSchema,
} from "./model-definition.schema";
import { safeJsonSchema } from "./safe-json";

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();
const dateTime = z.string().datetime({ offset: true });

export const modelListQuerySchema = z
  .object({
    ativo: z.enum(["true", "false"]).optional(),
    status: versionStatusSchema.optional(),
  })
  .strict();

export const createModelInputSchema = safeJsonSchema(
  z
    .object({ definition: institutionalModelDefinitionSchema })
    .strict()
    .superRefine(({ definition }, context) => {
      if (definition.status !== "RASCUNHO" || definition.version !== 1) {
        context.addIssue({
          code: "custom",
          message: "Um modelo novo deve iniciar na versão 1 em rascunho.",
          path: ["definition"],
        });
      }
    }),
);

export const updateModelMetadataSchema = safeJsonSchema(
  z
    .object({
      nome: z.string().trim().min(1).max(160).optional(),
      descricao: optionalText(2_000),
      instituicao: optionalText(160),
      ativo: z.boolean().optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 0, {
      message: "Informe ao menos um campo para atualizar.",
    }),
);

export const createDraftVersionSchema = safeJsonSchema(
  z.object({ sourceVersionId: z.string().min(1).max(128) }).strict(),
);

export const updateDraftVersionSchema = safeJsonSchema(
  z
    .object({
      changes: z.record(z.string(), z.unknown()),
    })
    .strict(),
);

export const transitionVersionSchema = safeJsonSchema(
  z
    .object({ nextStatus: z.enum(["PUBLICADA", "ARQUIVADA"]) })
    .strict(),
);

const authorInputSchema = z
  .object({
    nome: z.string().trim().min(1).max(200),
    email: z.string().trim().email().nullable().optional(),
    matricula: optionalText(100),
    curso: optionalText(160),
    instituicao: optionalText(160),
  })
  .strict();

const initialMemberRoleSchema = z.enum([
  PapelMembroProjetoTcc.COAUTOR_EDITOR,
  PapelMembroProjetoTcc.ORIENTADOR,
  PapelMembroProjetoTcc.REVISOR,
]);

const initialMemberSchema = z
  .object({
    usuarioId: z.string().trim().min(1).max(128),
    papel: initialMemberRoleSchema,
  })
  .strict();

const projectMemberSchema = z
  .object({
    usuarioId: z.string().trim().min(1).max(128),
    papel: z.nativeEnum(PapelMembroProjetoTcc),
  })
  .strict();

const sectionScheduleSchema = z
  .object({
    chave: z.string().trim().min(1).max(64),
    dataInicioPrevista: dateTime.nullable().optional(),
    dataEntregaPrevista: dateTime.nullable().optional(),
  })
  .strict()
  .refine(
    ({ dataInicioPrevista, dataEntregaPrevista }) =>
      !dataInicioPrevista ||
      !dataEntregaPrevista ||
      new Date(dataInicioPrevista) <= new Date(dataEntregaPrevista),
    {
      message:
        "A data de início prevista deve ser anterior ou igual à data de entrega.",
      path: ["dataEntregaPrevista"],
    },
  );

const projectDateFields = {
  dataInicioPrevista: dateTime.nullable().optional(),
  dataEntregaPrevista: dateTime.nullable().optional(),
  dataDefesaPrevista: dateTime.nullable().optional(),
};

export const createProjectInputSchema = safeJsonSchema(
  z
    .object({
      versaoModeloId: z.string().trim().min(1).max(128),
      titulo: z.string().trim().min(1).max(240),
      subtitulo: optionalText(240),
      resumo: optionalText(20_000),
      palavrasChave: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
      instituicao: optionalText(160),
      curso: optionalText(160),
      programa: optionalText(160),
      campus: optionalText(160),
      cidade: optionalText(160),
      estado: optionalText(100),
      pais: optionalText(100),
      anoConclusao: z.number().int().min(1900).max(3000).nullable().optional(),
      ...projectDateFields,
      autores: z.array(authorInputSchema).max(100).default([]),
      membros: z.array(initialMemberSchema).max(100).default([]),
      cronogramaSecoes: z.array(sectionScheduleSchema).max(1_000).default([]),
    })
    .strict()
    .superRefine((project, context) => {
      if (
        project.dataInicioPrevista &&
        project.dataEntregaPrevista &&
        new Date(project.dataInicioPrevista) >
          new Date(project.dataEntregaPrevista)
      ) {
        context.addIssue({
          code: "custom",
          message:
            "A data de início prevista deve ser anterior ou igual à data de entrega.",
          path: ["dataEntregaPrevista"],
        });
      }

      const memberIds = project.membros.map((member) => member.usuarioId);
      if (new Set(memberIds).size !== memberIds.length) {
        context.addIssue({
          code: "custom",
          message: "Um usuário não pode aparecer mais de uma vez nos membros.",
          path: ["membros"],
        });
      }
      if (memberIds.includes("")) {
        context.addIssue({
          code: "custom",
          message: "usuarioId não pode ser vazio.",
          path: ["membros"],
        });
      }

      const sectionKeys = project.cronogramaSecoes.map((section) => section.chave);
      if (new Set(sectionKeys).size !== sectionKeys.length) {
        context.addIssue({
          code: "custom",
          message: "Cada seção pode ter apenas uma entrada no cronograma.",
          path: ["cronogramaSecoes"],
        });
      }
    }),
);

export const updateProjectInputSchema = safeJsonSchema(
  z
    .object({
      titulo: z.string().trim().min(1).max(240).optional(),
      subtitulo: optionalText(240),
      resumo: optionalText(20_000),
      palavrasChave: z.array(z.string().trim().min(1).max(120)).max(100).optional(),
      instituicao: optionalText(160),
      curso: optionalText(160),
      programa: optionalText(160),
      campus: optionalText(160),
      cidade: optionalText(160),
      estado: optionalText(100),
      pais: optionalText(100),
      anoConclusao: z.number().int().min(1900).max(3000).nullable().optional(),
      ...projectDateFields,
    })
    .strict()
    .refine((project) => Object.keys(project).length > 0, {
      message: "Informe ao menos um campo para atualizar.",
    })
    .refine(
      (project) =>
        !project.dataInicioPrevista ||
        !project.dataEntregaPrevista ||
        new Date(project.dataInicioPrevista) <=
          new Date(project.dataEntregaPrevista),
      {
        message:
          "A data de início prevista deve ser anterior ou igual à data de entrega.",
        path: ["dataEntregaPrevista"],
      },
    ),
);

export const replaceAuthorsInputSchema = safeJsonSchema(
  z.object({ autores: z.array(authorInputSchema).max(100) }).strict(),
);

export const replaceMembersInputSchema = safeJsonSchema(
  z
    .object({ membros: z.array(projectMemberSchema).max(100) })
    .strict()
    .superRefine(({ membros }, context) => {
      const userIds = membros.map((member) => member.usuarioId);
      if (new Set(userIds).size !== userIds.length) {
        context.addIssue({
          code: "custom",
          message: "Um usuário não pode aparecer mais de uma vez nos membros.",
          path: ["membros"],
        });
      }
      if (
        !membros.some(
          (member) => member.papel === PapelMembroProjetoTcc.PROPRIETARIO,
        )
      ) {
        context.addIssue({
          code: "custom",
          message: "O projeto deve manter ao menos um proprietário ativo.",
          path: ["membros"],
        });
      }
    }),
);

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type AuthorInput = z.infer<typeof authorInputSchema>;
export type InitialMemberInput = z.infer<typeof initialMemberSchema>;
export type ProjectMemberInput = z.infer<typeof projectMemberSchema>;
