import { StatusVersaoModeloInstitucional } from "../generated/prisma/enums";
import { prisma } from "../prisma";
import { TccApiError } from "./errors";
import {
  institutionalModelDefinitionSchema,
  type InstitutionalModelDefinition,
} from "./model-definition.schema";
import {
  assertModelDefinitionSemantics,
  ModelDefinitionSemanticError,
} from "./semantic-validation";
import {
  createModelInputSchema,
  createDraftVersionSchema,
  updateDraftVersionSchema,
  updateModelMetadataSchema,
} from "./api-schemas";
import {
  createNextDraftVersion,
  transitionVersionStatus,
  updateDraftVersion,
  type DraftVersionChanges,
} from "./versioning";
import { toPrismaJsonObject } from "./prisma-json";

type VersionRow = {
  numeroVersao: number;
  status: StatusVersaoModeloInstitucional;
  definicaoJson: unknown;
};

function parseStoredDefinition(row: VersionRow): InstitutionalModelDefinition {
  const definition = institutionalModelDefinitionSchema.parse(row.definicaoJson);
  assertModelDefinitionSemantics(definition);
  if (
    definition.version !== row.numeroVersao ||
    definition.status !== row.status
  ) {
    throw new TccApiError(409, "A versão persistida está inconsistente.");
  }
  return definition;
}

export async function createInstitutionalModel(input: unknown) {
  const { definition: inputDefinition } = createModelInputSchema.parse(input);
  assertModelDefinitionSemantics(inputDefinition);

  return prisma.$transaction(async (tx) => {
    const model = await tx.modeloInstitucional.create({
      data: {
        nome: inputDefinition.name,
        descricao: inputDefinition.description,
        instituicao: inputDefinition.issuer,
      },
    });
    const definition = institutionalModelDefinitionSchema.parse({
      ...inputDefinition,
      modelId: inputDefinition.modelId,
    });
    const version = await tx.versaoModeloInstitucional.create({
      data: {
        modeloInstitucionalId: model.id,
        numeroVersao: 1,
        status: StatusVersaoModeloInstitucional.RASCUNHO,
        definicaoJson: toPrismaJsonObject(definition),
      },
    });
    return { ...model, versoes: [version] };
  });
}

export async function createInstitutionalModelDraft(
  modelId: string,
  input: unknown,
) {
  const { sourceVersionId } = createDraftVersionSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const source = await tx.versaoModeloInstitucional.findFirst({
      where: { id: sourceVersionId, modeloInstitucionalId: modelId },
    });
    if (!source) throw new TccApiError(404, "Versão não encontrada.");

    const sourceDefinition = parseStoredDefinition(source);
    let definition: InstitutionalModelDefinition;
    try {
      definition = createNextDraftVersion(sourceDefinition);
    } catch (error) {
      throw new TccApiError(
        409,
        error instanceof Error
          ? error.message
          : "Não foi possível criar o rascunho.",
      );
    }

    return tx.versaoModeloInstitucional.create({
      data: {
        modeloInstitucionalId: modelId,
        numeroVersao: definition.version,
        status: StatusVersaoModeloInstitucional.RASCUNHO,
        definicaoJson: toPrismaJsonObject(definition),
      },
    });
  });
}

export async function updateInstitutionalModelDraft(
  modelId: string,
  versionId: string,
  input: unknown,
) {
  const { changes } = updateDraftVersionSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const row = await tx.versaoModeloInstitucional.findFirst({
      where: { id: versionId, modeloInstitucionalId: modelId },
    });
    if (!row) throw new TccApiError(404, "Versão não encontrada.");
    if (row.status !== StatusVersaoModeloInstitucional.RASCUNHO) {
      throw new TccApiError(
        409,
        "Versões publicadas ou arquivadas são imutáveis; crie uma nova versão.",
      );
    }

    const current = parseStoredDefinition(row);
    let definition: InstitutionalModelDefinition;
    try {
      definition = updateDraftVersion(
        current,
        changes as DraftVersionChanges,
      );
    } catch (error) {
      if (error instanceof ModelDefinitionSemanticError) throw error;
      if (error instanceof Error && error.message.startsWith("Campos protegidos")) {
        throw new TccApiError(400, error.message);
      }
      if (error instanceof Error && error.message.includes("imutáveis")) {
        throw new TccApiError(409, error.message);
      }
      throw error;
    }

    const result = await tx.versaoModeloInstitucional.updateMany({
      where: {
        id: versionId,
        modeloInstitucionalId: modelId,
        status: StatusVersaoModeloInstitucional.RASCUNHO,
      },
      data: {
        definicaoJson: toPrismaJsonObject(definition),
        resumo: definition.description,
      },
    });
    if (result.count !== 1) {
      throw new TccApiError(409, "A versão mudou durante a atualização.");
    }
    await tx.modeloInstitucional.update({
      where: { id: modelId },
      data: {
        nome: definition.name,
        descricao: definition.description,
        instituicao: definition.issuer,
      },
    });
    return tx.versaoModeloInstitucional.findUniqueOrThrow({
      where: { id: versionId },
    });
  });
}

export async function transitionInstitutionalModelVersion(
  modelId: string,
  versionId: string,
  nextStatus: "PUBLICADA" | "ARQUIVADA",
) {
  return prisma.$transaction(async (tx) => {
    const row = await tx.versaoModeloInstitucional.findFirst({
      where: { id: versionId, modeloInstitucionalId: modelId },
    });
    if (!row) throw new TccApiError(404, "Versão não encontrada.");
    const current = parseStoredDefinition(row);

    let definition: InstitutionalModelDefinition;
    try {
      definition = transitionVersionStatus(current, nextStatus);
    } catch (error) {
      throw new TccApiError(
        409,
        error instanceof Error
          ? error.message
          : "Transição de versão não permitida.",
      );
    }
    assertModelDefinitionSemantics(definition);

    const result = await tx.versaoModeloInstitucional.updateMany({
      where: {
        id: versionId,
        modeloInstitucionalId: modelId,
        status: row.status,
      },
      data: {
        status: nextStatus,
        definicaoJson: toPrismaJsonObject(definition),
        ...(nextStatus === StatusVersaoModeloInstitucional.PUBLICADA
          ? { publicadoEm: new Date() }
          : { arquivadoEm: new Date() }),
      },
    });
    if (result.count !== 1) {
      throw new TccApiError(409, "A versão mudou durante a transição.");
    }
    return tx.versaoModeloInstitucional.findUniqueOrThrow({
      where: { id: versionId },
    });
  });
}

export async function updateInstitutionalModelMetadata(
  modelId: string,
  input: unknown,
) {
  const data = updateModelMetadataSchema.parse(input);
  return prisma.modeloInstitucional.update({ where: { id: modelId }, data });
}

export async function listInstitutionalModels(
  active: boolean | undefined,
  status: StatusVersaoModeloInstitucional | undefined,
  canManage: boolean,
) {
  const visibleStatus = canManage
    ? status
    : StatusVersaoModeloInstitucional.PUBLICADA;
  return prisma.modeloInstitucional.findMany({
    where: {
      ativo: canManage ? active : true,
      ...(visibleStatus === undefined
        ? {}
        : { versoes: { some: { status: visibleStatus } } }),
    },
    orderBy: [{ nome: "asc" }, { criadoEm: "asc" }],
    select: {
      id: true,
      nome: true,
      descricao: true,
      instituicao: true,
      ativo: true,
      criadoEm: true,
      atualizadoEm: true,
      versoes: {
        ...(visibleStatus === undefined
          ? {}
          : { where: { status: visibleStatus } }),
        orderBy: { numeroVersao: "desc" },
        select: {
          id: true,
          numeroVersao: true,
          status: true,
          resumo: true,
          publicadoEm: true,
          arquivadoEm: true,
          criadoEm: true,
        },
      },
    },
  });
}

export async function getInstitutionalModel(
  modelId: string,
  canManage: boolean,
) {
  const model = await prisma.modeloInstitucional.findUnique({
    where: { id: modelId, ...(canManage ? {} : { ativo: true }) },
    include: {
      versoes: {
        ...(canManage
          ? {}
          : { where: { status: StatusVersaoModeloInstitucional.PUBLICADA } }),
        orderBy: { numeroVersao: "desc" },
        select: {
          id: true,
          numeroVersao: true,
          status: true,
          resumo: true,
          publicadoEm: true,
          arquivadoEm: true,
          criadoEm: true,
        },
      },
    },
  });
  if (!model) throw new TccApiError(404, "Modelo não encontrado.");
  return model;
}

export async function getInstitutionalModelVersion(
  modelId: string,
  versionId: string,
  canManage: boolean,
) {
  const version = await prisma.versaoModeloInstitucional.findFirst({
    where: {
      id: versionId,
      modeloInstitucionalId: modelId,
      ...(canManage
        ? {}
        : {
            status: StatusVersaoModeloInstitucional.PUBLICADA,
            modeloInstitucional: { is: { ativo: true } },
          }),
    },
  });
  if (!version) throw new TccApiError(404, "Versão não encontrada.");
  return version;
}

export async function listInstitutionalModelVersions(
  modelId: string,
  canManage: boolean,
) {
  const modelExists = await prisma.modeloInstitucional.findFirst({
    where: { id: modelId, ...(canManage ? {} : { ativo: true }) },
    select: { id: true },
  });
  if (!modelExists) throw new TccApiError(404, "Modelo não encontrado.");
  return prisma.versaoModeloInstitucional.findMany({
    where: {
      modeloInstitucionalId: modelId,
      ...(canManage
        ? {}
        : { status: StatusVersaoModeloInstitucional.PUBLICADA }),
    },
    orderBy: { numeroVersao: "desc" },
    select: {
      id: true,
      modeloInstitucionalId: true,
      numeroVersao: true,
      status: true,
      resumo: true,
      publicadoEm: true,
      arquivadoEm: true,
      criadoEm: true,
    },
  });
}

