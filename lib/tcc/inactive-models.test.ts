import { isTccModelManagerId } from "./authorization";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StatusVersaoModeloInstitucional } from "../generated/prisma/enums";
import {
  getInstitutionalModelVersion,
  listInstitutionalModelVersions,
} from "./model-service";
import {
  createTccProject,
  getTccProject,
  updateTccProject,
} from "./project-service";
import { institutionalModelDefinitionSchema } from "./model-definition.schema";

const prismaMock = vi.hoisted(() => {
  const tx = {
    modeloInstitucional: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    versaoModeloInstitucional: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    projetoTcc: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    membroProjetoTcc: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
    autorTcc: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    secaoTcc: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    usuario: { count: vi.fn() },
  };
  return {
    tx,
    ...tx,
    $transaction: vi.fn(),
  };
});

vi.mock("../prisma", () => ({ prisma: prismaMock }));

function createDefinition() {
  return institutionalModelDefinitionSchema.parse({
    schemaVersion: 1,
    modelId: "model-a",
    name: "Modelo configurável",
    version: 1,
    status: "PUBLICADA",
    formatting: {
      page: { size: "custom", orientation: "portrait" },
      marginsMm: { top: 10, right: 10, bottom: 10, left: 10 },
      typography: {
        fontFamily: "Sans",
        bodySizePt: 11,
        lineHeight: 1.4,
        sizes: {},
      },
      alignment: "left",
      spacing: {},
      numbering: { enabled: false, style: "none", startAt: 1 },
      pagination: {
        enabled: false,
        position: "bottom",
        includeFirstPage: false,
      },
      styles: {},
    },
    sections: [
      {
        key: "introduction",
        title: "Introdução",
        category: "content",
        mode: "manual",
        required: true,
        numbered: true,
        order: 1,
        subsections: [],
      },
    ],
    automaticElements: [],
  });
}

function resetMockState() {
  vi.resetAllMocks();
  prismaMock.$transaction.mockImplementation(
    async (operation: (tx: typeof prismaMock.tx) => Promise<unknown>) =>
      operation(prismaMock.tx),
  );
}

describe("visibilidade de versões de modelos inativos", () => {
  beforeEach(resetMockState);

  it("oculta versão e listagem de modelo inativo para usuário comum", async () => {
    prismaMock.versaoModeloInstitucional.findFirst.mockResolvedValue(null);
    prismaMock.modeloInstitucional.findFirst.mockResolvedValue(null);

    await expect(
      getInstitutionalModelVersion("model-inactive", "version-a", false),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      listInstitutionalModelVersions("model-inactive", false),
    ).rejects.toMatchObject({ status: 404 });

    expect(prismaMock.versaoModeloInstitucional.findFirst).toHaveBeenCalledWith({
      where: {
        id: "version-a",
        modeloInstitucionalId: "model-inactive",
        status: StatusVersaoModeloInstitucional.PUBLICADA,
        modeloInstitucional: { is: { ativo: true } },
      },
    });
    expect(prismaMock.modeloInstitucional.findFirst).toHaveBeenCalledWith({
      where: { id: "model-inactive", ativo: true },
      select: { id: true },
    });
    expect(prismaMock.versaoModeloInstitucional.findMany).not.toHaveBeenCalled();
  });

  it("permite ao gestor consultar versões de modelo inativo", async () => {
    const version = { id: "version-a", status: "RASCUNHO" };
    prismaMock.versaoModeloInstitucional.findFirst.mockResolvedValue(version);
    prismaMock.modeloInstitucional.findFirst.mockResolvedValue({ id: "model-inactive" });
    prismaMock.versaoModeloInstitucional.findMany.mockResolvedValue([version]);
    const previousManagerIds = process.env.TCC_MODEL_MANAGER_IDS;
    process.env.TCC_MODEL_MANAGER_IDS = "user-manager";
    try {
      const canManage = isTccModelManagerId(
        "user-manager",
        process.env.TCC_MODEL_MANAGER_IDS,
      );
      expect(canManage).toBe(true);
      await expect(
        getInstitutionalModelVersion("model-inactive", "version-a", canManage),
      ).resolves.toBe(version);
      await expect(
        listInstitutionalModelVersions("model-inactive", canManage),
      ).resolves.toEqual([version]);
    } finally {
      if (previousManagerIds === undefined) {
        delete process.env.TCC_MODEL_MANAGER_IDS;
      } else {
        process.env.TCC_MODEL_MANAGER_IDS = previousManagerIds;
      }
    }

    expect(prismaMock.versaoModeloInstitucional.findFirst).toHaveBeenCalledWith({
      where: { id: "version-a", modeloInstitucionalId: "model-inactive" },
    });
    expect(prismaMock.modeloInstitucional.findFirst).toHaveBeenCalledWith({
      where: { id: "model-inactive" },
      select: { id: true },
    });
    expect(prismaMock.versaoModeloInstitucional.findMany).toHaveBeenCalledWith({
      where: { modeloInstitucionalId: "model-inactive" },
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
  });
});

describe("independência de projetos em relação ao modelo de origem", () => {
  beforeEach(resetMockState);

  it("rejeita criação de projeto quando o modelo pai está inativo", async () => {
    prismaMock.versaoModeloInstitucional.findUnique.mockResolvedValue({
      id: "version-a",
      status: StatusVersaoModeloInstitucional.PUBLICADA,
      numeroVersao: 1,
      definicaoJson: createDefinition(),
      modeloInstitucional: { ativo: false },
    });

    await expect(
      createTccProject("user-owner", {
        versaoModeloId: "version-a",
        titulo: "Projeto de teste",
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(prismaMock.projetoTcc.create).not.toHaveBeenCalled();
    expect(prismaMock.secaoTcc.create).not.toHaveBeenCalled();
  });

  it("lê e atualiza projeto existente pelo snapshot sem consultar o modelo original", async () => {
    const snapshot = createDefinition();
    prismaMock.membroProjetoTcc.findFirst.mockResolvedValue({
      papel: "PROPRIETARIO",
      ativo: true,
    });
    prismaMock.projetoTcc.findUnique
      .mockResolvedValueOnce({
        id: "project-a",
        snapshotModeloJson: snapshot,
        autores: [],
        membros: [],
      })
      .mockResolvedValueOnce({
        dataInicioPrevista: null,
        dataEntregaPrevista: null,
      });
    prismaMock.secaoTcc.findMany.mockResolvedValue([]);
    prismaMock.projetoTcc.update.mockResolvedValue({
      id: "project-a",
      titulo: "Título atualizado",
      snapshotModeloJson: snapshot,
    });

    const result = await getTccProject("user-owner", "project-a", "READ_PROJECT");
    const updated = await updateTccProject("user-owner", "project-a", {
      titulo: "Título atualizado",
    });

    expect(result.snapshotModeloJson).toEqual(snapshot);
    expect(updated.snapshotModeloJson).toEqual(snapshot);
    expect(prismaMock.versaoModeloInstitucional.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.modeloInstitucional.findUnique).not.toHaveBeenCalled();
  });

  it("impede leitura e mutação cruzada entre projeto e usuário", async () => {
    prismaMock.membroProjetoTcc.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ papel: "PROPRIETARIO", ativo: false })
      .mockResolvedValueOnce({ papel: "ORIENTADOR", ativo: true });

    await expect(
      getTccProject("user-outsider", "project-private", "READ_PROJECT"),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      getTccProject("user-inactive", "project-private", "READ_PROJECT"),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      updateTccProject("user-advisor", "project-private", {
        titulo: "Tentativa indevida",
      }),
    ).rejects.toMatchObject({ status: 403 });

    expect(prismaMock.projetoTcc.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.projetoTcc.update).not.toHaveBeenCalled();
  });

  it("descarta criações parciais quando a transação falha ao criar seções", async () => {
    const persisted: Array<{ projeto: unknown; autores: unknown[]; membros: unknown[]; secoes: unknown[] }> = [];
    let staged:
      | { projeto: unknown; autores: unknown[]; membros: unknown[]; secoes: unknown[] }
      | undefined;

    prismaMock.$transaction.mockImplementation(
      async (operation: (tx: typeof prismaMock.tx) => Promise<unknown>) => {
        staged = { projeto: null, autores: [], membros: [], secoes: [] };
        try {
          const result = await operation(prismaMock.tx);
          persisted.push(staged);
          return result;
        } finally {
          staged = undefined;
        }
      },
    );
    prismaMock.versaoModeloInstitucional.findUnique.mockResolvedValue({
      id: "version-a",
      status: StatusVersaoModeloInstitucional.PUBLICADA,
      numeroVersao: 1,
      definicaoJson: createDefinition(),
      modeloInstitucional: { ativo: true },
    });
    prismaMock.usuario.count.mockResolvedValue(2);
    prismaMock.projetoTcc.create.mockImplementation(async ({ data }) => {
      if (staged) {
        staged.projeto = data;
        staged.autores.push(...data.autores.create);
        staged.membros.push(...data.membros.create);
      }
      return { id: "project-partial" };
    });
    prismaMock.secaoTcc.create.mockImplementation(async ({ data }) => {
      staged?.secoes.push(data);
      throw new Error("Falha simulada após criação parcial.");
    });

    await expect(
      createTccProject("user-owner", {
        versaoModeloId: "version-a",
        titulo: "Projeto com falha",
        autores: [{ nome: "Autora" }],
        membros: [{ usuarioId: "user-advisor", papel: "ORIENTADOR" }],
      }),
    ).rejects.toThrow("Falha simulada após criação parcial.");

    expect(persisted).toEqual([]);
    expect(staged).toBeUndefined();
    expect(prismaMock.projetoTcc.create).toHaveBeenCalledOnce();
    expect(prismaMock.secaoTcc.create).toHaveBeenCalledOnce();
  });
});
