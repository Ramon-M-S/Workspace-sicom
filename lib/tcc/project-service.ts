import { randomUUID } from "node:crypto";
import type { PapelMembroProjetoTcc } from "../generated/prisma/enums";
import type { Prisma } from "../generated/prisma/client";
import { StatusVersaoModeloInstitucional } from "../generated/prisma/enums";
import { prisma } from "../prisma";
import { TccApiError } from "./errors";
import { assertTccProjectAccess } from "./project-access";
import {
  createProjectInputSchema,
  replaceAuthorsInputSchema,
  replaceMembersInputSchema,
  updateProjectInputSchema,
} from "./api-schemas";
import type {
  InstitutionalModelDefinition,
  SectionDefinition,
} from "./model-definition.schema";
import {
  assertModelDefinitionSemantics,
  ModelDefinitionSemanticError,
} from "./semantic-validation";
import {
  editorDocumentSchema,
  type EditorDocument,
} from "./editor-document.schema";
import { institutionalModelDefinitionSchema } from "./model-definition.schema";
import { createProjectModelSnapshot } from "./versioning";
import { toPrismaJsonObject } from "./prisma-json";
import type {
  AuthorInput,
  InitialMemberInput,
} from "./api-schemas";

export interface SectionScheduleInput {
  chave: string;
  dataInicioPrevista?: string | null;
  dataEntregaPrevista?: string | null;
}

export interface InitialSectionRecord {
  chave: string;
  secaoPaiChave: string | null;
  titulo: string;
  categoria: string;
  modo: "MANUAL" | "AUTOMATICO" | "HIBRIDO";
  ordem: number;
  conteudoJson: EditorDocument;
  dataInicioPrevista: Date | null;
  dataEntregaPrevista: Date | null;
}

export interface ProjectPeople {
  autores: Array<AuthorInput & { ordem: number }>;
  membros: Array<{
    usuarioId: string;
    papel: PapelMembroProjetoTcc;
    ativo: true;
  }>;
}

export type SectionTreeNode<T> = T & {
  subsecoes: SectionTreeNode<T>[];
};

export function buildSectionTree<
  T extends { id: string; secaoPaiId: string | null; ordem: number },
>(sections: T[]): SectionTreeNode<T>[] {
  const nodes = new Map<string, SectionTreeNode<T>>();
  for (const section of sections) {
    if (nodes.has(section.id)) {
      throw new TypeError(`A seção "${section.id}" está duplicada.`);
    }
    nodes.set(section.id, { ...section, subsecoes: [] });
  }

  const roots: SectionTreeNode<T>[] = [];
  const ordered = sections
    .map((section, index) => ({ section, index }))
    .sort(
      (left, right) =>
        (left.section.secaoPaiId ?? "").localeCompare(
          right.section.secaoPaiId ?? "",
        ) ||
        left.section.ordem - right.section.ordem ||
        left.index - right.index,
    );
  for (const { section } of ordered) {
    const node = nodes.get(section.id);
    if (!node) throw new TypeError("A estrutura de seções está inconsistente.");
    if (section.secaoPaiId === null) {
      roots.push(node);
      continue;
    }
    const parent = nodes.get(section.secaoPaiId);
    if (!parent || parent.id === node.id) {
      throw new TypeError("A hierarquia de seções contém uma referência inválida.");
    }
    parent.subsecoes.push(node);
  }

  const visited = new Set<string>();
  const visit = (node: SectionTreeNode<T>) => {
    if (visited.has(node.id)) {
      throw new TypeError("A hierarquia de seções contém um ciclo.");
    }
    visited.add(node.id);
    node.subsecoes.forEach(visit);
  };
  roots.forEach(visit);
  if (visited.size !== nodes.size) {
    throw new TypeError("A hierarquia de seções contém um ciclo.");
  }
  return roots;
}

function parseOptionalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new TypeError("Data inválida no cronograma de seção.");
  }
  return date;
}

function sortSections(sections: SectionDefinition[]): SectionDefinition[] {
  return sections
    .map((section, index) => ({ section, index }))
    .sort(
      (left, right) =>
        left.section.order - right.section.order || left.index - right.index,
    )
    .map(({ section }) => section);
}

function toSectionMode(
  mode: SectionDefinition["mode"],
): InitialSectionRecord["modo"] {
  switch (mode) {
    case "manual":
      return "MANUAL";
    case "automatic":
      return "AUTOMATICO";
    case "hybrid":
      return "HIBRIDO";
  }
}

export function buildInitialSectionRecords(
  definition: InstitutionalModelDefinition,
  schedule: SectionScheduleInput[] = [],
  createDocumentId: () => string = randomUUID,
): InitialSectionRecord[] {
  assertModelDefinitionSemantics(definition);

  const sectionKeys = new Set<string>();
  const collectKeys = (sections: SectionDefinition[]) => {
    for (const section of sections) {
      sectionKeys.add(section.key);
      collectKeys(section.subsections);
    }
  };
  collectKeys(definition.sections);

  const scheduleByKey = new Map<string, SectionScheduleInput>();
  for (const item of schedule) {
    if (!sectionKeys.has(item.chave)) {
      throw new TypeError(`A seção "${item.chave}" não existe no modelo.`);
    }
    if (scheduleByKey.has(item.chave)) {
      throw new TypeError(`Cronograma duplicado para a seção "${item.chave}".`);
    }
    const start = parseOptionalDate(item.dataInicioPrevista);
    const end = parseOptionalDate(item.dataEntregaPrevista);
    if (start && end && start > end) {
      throw new TypeError(
        `A data de início da seção "${item.chave}" deve ser anterior à entrega.`,
      );
    }
    scheduleByKey.set(item.chave, item);
  }

  const records: InitialSectionRecord[] = [];
  const visit = (
    sections: SectionDefinition[],
    parentKey: string | null,
  ) => {
    for (const section of sortSections(sections)) {
      const entry = scheduleByKey.get(section.key);
      const content = editorDocumentSchema.parse({
        schemaVersion: 1,
        documentId: createDocumentId(),
        title: section.title,
        blocks: [],
      });
      records.push({
        chave: section.key,
        secaoPaiChave: parentKey,
        titulo: section.title,
        categoria: section.category,
        modo: toSectionMode(section.mode),
        ordem: section.order,
        conteudoJson: content,
        dataInicioPrevista: parseOptionalDate(entry?.dataInicioPrevista),
        dataEntregaPrevista: parseOptionalDate(entry?.dataEntregaPrevista),
      });
      visit(section.subsections, section.key);
    }
  };
  visit(definition.sections, null);
  return records;
}

export function buildProjectPeople(
  ownerUserId: string,
  authors: AuthorInput[],
  members: InitialMemberInput[],
): ProjectPeople {
  if (members.some((member) => member.usuarioId === ownerUserId)) {
    throw new TypeError("O criador já é registrado como proprietário.");
  }
  return {
    autores: authors.map((author, index) => ({
      ...author,
      ordem: index + 1,
    })),
    membros: [
      {
        usuarioId: ownerUserId,
        papel: "PROPRIETARIO",
        ativo: true,
      },
      ...members.map((member) => ({
        ...member,
        ativo: true as const,
      })),
    ],
  };
}

function toDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError("Data inválida.");
  return date;
}

async function loadProject(
  client: Prisma.TransactionClient | typeof prisma,
  projectId: string,
) {
  const project = await client.projetoTcc.findUnique({
    where: { id: projectId },
    include: {
      autores: { orderBy: { ordem: "asc" } },
      membros: {
        where: { ativo: true },
        include: { usuario: { select: { id: true, nome: true, email: true } } },
      },
    },
  });
  if (!project) throw new TccApiError(404, "Projeto não encontrado.");
  const sections = await client.secaoTcc.findMany({
    where: { projetoId: projectId },
    orderBy: [{ secaoPaiId: "asc" }, { ordem: "asc" }],
  });
  return { ...project, secoes: buildSectionTree(sections) };
}

export async function createTccProject(userId: string, input: unknown) {
  const data = createProjectInputSchema.parse(input);
  if (data.membros.some((member) => member.usuarioId === userId)) {
    throw new TccApiError(400, "O criador já será registrado como proprietário.");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const version = await tx.versaoModeloInstitucional.findUnique({
        where: { id: data.versaoModeloId },
        include: { modeloInstitucional: { select: { ativo: true } } },
      });
      if (!version) throw new TccApiError(404, "Versão de modelo não encontrada.");
      if (!version.modeloInstitucional.ativo) {
        throw new TccApiError(404, "Versão de modelo não encontrada.");
      }
      if (version.status !== StatusVersaoModeloInstitucional.PUBLICADA) {
        throw new TccApiError(
          409,
          "O projeto deve usar uma versão publicada do modelo.",
        );
      }

      const definition =
        institutionalModelDefinitionSchema.parse(version.definicaoJson);
      assertModelDefinitionSemantics(definition);
      if (
        definition.status !== version.status ||
        definition.version !== version.numeroVersao
      ) {
        throw new TccApiError(409, "A versão do modelo está inconsistente.");
      }

      const snapshot = createProjectModelSnapshot(definition);
      const sectionRecords = buildInitialSectionRecords(
        definition,
        data.cronogramaSecoes,
      );
      const people = buildProjectPeople(userId, data.autores, data.membros);
      const userIds = people.membros.map((member) => member.usuarioId);
      const existingUsers = await tx.usuario.count({
        where: { id: { in: userIds } },
      });
      if (existingUsers !== new Set(userIds).size) {
        throw new TccApiError(400, "Um ou mais usuários informados não são válidos.");
      }

      const project = await tx.projetoTcc.create({
        data: {
          versaoModeloId: data.versaoModeloId,
          titulo: data.titulo,
          subtitulo: data.subtitulo,
          resumo: data.resumo,
          palavrasChave: data.palavrasChave,
          instituicao: data.instituicao,
          curso: data.curso,
          programa: data.programa,
          campus: data.campus,
          cidade: data.cidade,
          estado: data.estado,
          pais: data.pais,
          anoConclusao: data.anoConclusao,
          dataInicioPrevista: toDate(data.dataInicioPrevista),
          dataEntregaPrevista: toDate(data.dataEntregaPrevista),
          dataDefesaPrevista: toDate(data.dataDefesaPrevista),
          snapshotModeloJson: toPrismaJsonObject(snapshot),
          autores: { create: people.autores },
          membros: { create: people.membros },
        },
        select: { id: true },
      });

      const sectionIds = new Map<string, string>();
      for (const section of sectionRecords) {
        const secaoPaiId = section.secaoPaiChave
          ? sectionIds.get(section.secaoPaiChave)
          : null;
        if (section.secaoPaiChave && !secaoPaiId) {
          throw new TypeError("A hierarquia inicial de seções está inconsistente.");
        }
        const createdSection = await tx.secaoTcc.create({
          data: {
            projetoId: project.id,
            secaoPaiId,
            ordem: section.ordem,
            titulo: section.titulo,
            categoria: section.categoria,
            modo: section.modo,
            conteudoJson: toPrismaJsonObject(section.conteudoJson),
            dataInicioPrevista: section.dataInicioPrevista,
            dataEntregaPrevista: section.dataEntregaPrevista,
          },
          select: { id: true },
        });
        sectionIds.set(section.chave, createdSection.id);
      }

      return loadProject(tx, project.id);
    });
  } catch (error) {
    if (error instanceof ModelDefinitionSemanticError) throw error;
    if (error instanceof TypeError && !(error instanceof TccApiError)) {
      throw new TccApiError(400, error.message);
    }
    throw error;
  }
}

export async function listTccProjects(userId: string) {
  return prisma.projetoTcc.findMany({
    where: {
      membros: { some: { usuarioId: userId, ativo: true } },
    },
    orderBy: [{ atualizadoEm: "desc" }, { id: "asc" }],
    include: {
      autores: { orderBy: { ordem: "asc" } },
      membros: {
        where: { usuarioId: userId, ativo: true },
        select: { papel: true, ativo: true },
      },
    },
  });
}

export async function getTccProject(
  userId: string,
  projectId: string,
  permission: "READ_PROJECT" | "EDIT_PROJECT" | "MANAGE_MEMBERS",
) {
  return prisma.$transaction(async (tx) => {
    await assertTccProjectAccess(tx, projectId, userId, permission);
    return loadProject(tx, projectId);
  });
}

export async function updateTccProject(
  userId: string,
  projectId: string,
  input: unknown,
) {
  const data = updateProjectInputSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    await assertTccProjectAccess(tx, projectId, userId, "EDIT_PROJECT");
    const existing = await tx.projetoTcc.findUnique({
      where: { id: projectId },
      select: { dataInicioPrevista: true, dataEntregaPrevista: true },
    });
    if (!existing) throw new TccApiError(404, "Projeto não encontrado.");
    const start =
      data.dataInicioPrevista === undefined
        ? existing.dataInicioPrevista
        : toDate(data.dataInicioPrevista);
    const end =
      data.dataEntregaPrevista === undefined
        ? existing.dataEntregaPrevista
        : toDate(data.dataEntregaPrevista);
    if (start && end && start > end) {
      throw new TccApiError(
        400,
        "A data de início prevista deve ser anterior ou igual à data de entrega.",
      );
    }
    return tx.projetoTcc.update({
      where: { id: projectId },
      data: {
        ...data,
        dataInicioPrevista: toDate(data.dataInicioPrevista),
        dataEntregaPrevista: toDate(data.dataEntregaPrevista),
        dataDefesaPrevista: toDate(data.dataDefesaPrevista),
      },
    });
  });
}

export async function replaceTccProjectAuthors(
  userId: string,
  projectId: string,
  input: unknown,
) {
  const { autores } = replaceAuthorsInputSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    await assertTccProjectAccess(tx, projectId, userId, "EDIT_PROJECT");
    await tx.autorTcc.deleteMany({ where: { projetoId: projectId } });
    if (autores.length > 0) {
      await tx.autorTcc.createMany({
        data: autores.map((author, index) => ({
          projetoId: projectId,
          ordem: index + 1,
          ...author,
        })),
      });
    }
    return tx.autorTcc.findMany({
      where: { projetoId: projectId },
      orderBy: { ordem: "asc" },
    });
  });
}

export async function listTccProjectMembers(
  userId: string,
  projectId: string,
) {
  return prisma.$transaction(async (tx) => {
    await assertTccProjectAccess(tx, projectId, userId, "READ_PROJECT");
    return tx.membroProjetoTcc.findMany({
      where: { projetoId: projectId, ativo: true },
      orderBy: [{ papel: "asc" }, { criadoEm: "asc" }],
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });
  });
}

export async function replaceTccProjectMembers(
  requesterId: string,
  projectId: string,
  input: unknown,
) {
  const { membros } = replaceMembersInputSchema.parse(input);
  const userIds = membros.map((member) => member.usuarioId);

  return prisma.$transaction(async (tx) => {
    await assertTccProjectAccess(
      tx,
      projectId,
      requesterId,
      "MANAGE_MEMBERS",
    );
    const existingUsers = await tx.usuario.count({
      where: { id: { in: userIds } },
    });
    if (existingUsers !== userIds.length) {
      throw new TccApiError(
        400,
        "Um ou mais usuários informados não são válidos.",
      );
    }
    await tx.membroProjetoTcc.updateMany({
      where: { projetoId: projectId, ativo: true },
      data: { ativo: false },
    });
    for (const member of membros) {
      await tx.membroProjetoTcc.upsert({
        where: {
          projetoId_usuarioId: {
            projetoId: projectId,
            usuarioId: member.usuarioId,
          },
        },
        create: {
          projetoId: projectId,
          usuarioId: member.usuarioId,
          papel: member.papel,
          ativo: true,
        },
        update: { papel: member.papel, ativo: true },
      });
    }
    return tx.membroProjetoTcc.findMany({
      where: { projetoId: projectId, ativo: true },
      orderBy: [{ papel: "asc" }, { criadoEm: "asc" }],
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });
  });
}
