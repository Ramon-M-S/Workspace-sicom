-- CreateEnum
CREATE TYPE "StatusVersaoModeloInstitucional" AS ENUM ('RASCUNHO', 'PUBLICADA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "PapelMembroProjetoTcc" AS ENUM ('PROPRIETARIO', 'COAUTOR_EDITOR', 'ORIENTADOR', 'REVISOR');

-- CreateEnum
CREATE TYPE "ModoSecaoTcc" AS ENUM ('MANUAL', 'AUTOMATICO', 'HIBRIDO');

-- CreateEnum
CREATE TYPE "StatusSecaoTcc" AS ENUM ('RASCUNHO', 'EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "EscopoComentarioSecaoTcc" AS ENUM ('GERAL', 'TRECHO');

-- CreateEnum
CREATE TYPE "EstadoAncoraComentarioSecaoTcc" AS ENUM ('ATIVO', 'TEXTO_ALTERADO', 'BLOCO_REMOVIDO');

-- CreateTable
CREATE TABLE "modelos_institucionais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "instituicao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "modelos_institucionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versoes_modelos_institucionais" (
    "id" TEXT NOT NULL,
    "modeloInstitucionalId" TEXT NOT NULL,
    "numeroVersao" INTEGER NOT NULL,
    "status" "StatusVersaoModeloInstitucional" NOT NULL DEFAULT 'RASCUNHO',
    "definicaoJson" JSONB NOT NULL,
    "resumo" TEXT,
    "publicadoEm" TIMESTAMPTZ(3),
    "arquivadoEm" TIMESTAMPTZ(3),
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versoes_modelos_institucionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projetos_tcc" (
    "id" TEXT NOT NULL,
    "versaoModeloId" TEXT NOT NULL,
    "snapshotModeloJson" JSONB NOT NULL,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "resumo" TEXT,
    "palavrasChave" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instituicao" TEXT,
    "curso" TEXT,
    "programa" TEXT,
    "campus" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "pais" TEXT,
    "anoConclusao" INTEGER,
    "dataInicioPrevista" TIMESTAMPTZ(3),
    "dataEntregaPrevista" TIMESTAMPTZ(3),
    "dataDefesaPrevista" TIMESTAMPTZ(3),
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "projetos_tcc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autores_tcc" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "matricula" TEXT,
    "curso" TEXT,
    "instituicao" TEXT,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autores_tcc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_projeto_tcc" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "papel" "PapelMembroProjetoTcc" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "membros_projeto_tcc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secoes_tcc" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "secaoPaiId" TEXT,
    "ordem" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "modo" "ModoSecaoTcc" NOT NULL DEFAULT 'MANUAL',
    "conteudoJson" JSONB NOT NULL,
    "revisaoAtual" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusSecaoTcc" NOT NULL DEFAULT 'RASCUNHO',
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "dataInicioPrevista" TIMESTAMPTZ(3),
    "dataEntregaPrevista" TIMESTAMPTZ(3),
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "secoes_tcc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versoes_secoes_tcc" (
    "id" TEXT NOT NULL,
    "secaoId" TEXT NOT NULL,
    "numeroVersao" INTEGER NOT NULL,
    "revisaoBase" INTEGER NOT NULL,
    "conteudoJson" JSONB NOT NULL,
    "origem" TEXT NOT NULL,
    "resumo" TEXT,
    "autorUsuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versoes_secoes_tcc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios_secoes_tcc" (
    "id" TEXT NOT NULL,
    "secaoId" TEXT NOT NULL,
    "escopo" "EscopoComentarioSecaoTcc" NOT NULL,
    "blockId" TEXT,
    "trechoCitado" TEXT,
    "offsetInicio" INTEGER,
    "offsetFim" INTEGER,
    "estadoAncora" "EstadoAncoraComentarioSecaoTcc" NOT NULL DEFAULT 'ATIVO',
    "conteudo" TEXT NOT NULL,
    "resolvido" BOOLEAN NOT NULL DEFAULT false,
    "autorUsuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "comentarios_secoes_tcc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquivos_tcc" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "secaoId" TEXT,
    "nomeOriginal" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanhoBytes" BIGINT NOT NULL,
    "chaveStorage" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "enviadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquivos_tcc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "modelos_institucionais_nome_idx" ON "modelos_institucionais"("nome");

-- CreateIndex
CREATE INDEX "modelos_institucionais_ativo_idx" ON "modelos_institucionais"("ativo");

-- CreateIndex
CREATE INDEX "versoes_modelos_institucionais_modeloInstitucionalId_status_idx" ON "versoes_modelos_institucionais"("modeloInstitucionalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "versoes_modelos_institucionais_modeloInstitucionalId_numero_key" ON "versoes_modelos_institucionais"("modeloInstitucionalId", "numeroVersao");

-- CreateIndex
CREATE INDEX "projetos_tcc_versaoModeloId_idx" ON "projetos_tcc"("versaoModeloId");

-- CreateIndex
CREATE INDEX "projetos_tcc_titulo_idx" ON "projetos_tcc"("titulo");

-- CreateIndex
CREATE INDEX "projetos_tcc_dataEntregaPrevista_idx" ON "projetos_tcc"("dataEntregaPrevista");

-- CreateIndex
CREATE INDEX "autores_tcc_projetoId_idx" ON "autores_tcc"("projetoId");

-- CreateIndex
CREATE UNIQUE INDEX "autores_tcc_projetoId_ordem_key" ON "autores_tcc"("projetoId", "ordem");

-- CreateIndex
CREATE INDEX "membros_projeto_tcc_usuarioId_ativo_idx" ON "membros_projeto_tcc"("usuarioId", "ativo");

-- CreateIndex
CREATE INDEX "membros_projeto_tcc_projetoId_papel_ativo_idx" ON "membros_projeto_tcc"("projetoId", "papel", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "membros_projeto_tcc_projetoId_usuarioId_key" ON "membros_projeto_tcc"("projetoId", "usuarioId");

-- CreateIndex
CREATE INDEX "secoes_tcc_projetoId_ordem_idx" ON "secoes_tcc"("projetoId", "ordem");

-- CreateIndex
CREATE INDEX "secoes_tcc_projetoId_secaoPaiId_ordem_idx" ON "secoes_tcc"("projetoId", "secaoPaiId", "ordem");

-- CreateIndex
CREATE INDEX "secoes_tcc_status_dataEntregaPrevista_idx" ON "secoes_tcc"("status", "dataEntregaPrevista");

-- CreateIndex
CREATE INDEX "versoes_secoes_tcc_secaoId_revisaoBase_idx" ON "versoes_secoes_tcc"("secaoId", "revisaoBase");

-- CreateIndex
CREATE INDEX "versoes_secoes_tcc_autorUsuarioId_criadoEm_idx" ON "versoes_secoes_tcc"("autorUsuarioId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "versoes_secoes_tcc_secaoId_numeroVersao_key" ON "versoes_secoes_tcc"("secaoId", "numeroVersao");

-- CreateIndex
CREATE INDEX "comentarios_secoes_tcc_secaoId_resolvido_criadoEm_idx" ON "comentarios_secoes_tcc"("secaoId", "resolvido", "criadoEm");

-- CreateIndex
CREATE INDEX "comentarios_secoes_tcc_secaoId_blockId_idx" ON "comentarios_secoes_tcc"("secaoId", "blockId");

-- CreateIndex
CREATE INDEX "comentarios_secoes_tcc_autorUsuarioId_criadoEm_idx" ON "comentarios_secoes_tcc"("autorUsuarioId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "arquivos_tcc_chaveStorage_key" ON "arquivos_tcc"("chaveStorage");

-- CreateIndex
CREATE INDEX "arquivos_tcc_projetoId_categoria_idx" ON "arquivos_tcc"("projetoId", "categoria");

-- CreateIndex
CREATE INDEX "arquivos_tcc_secaoId_idx" ON "arquivos_tcc"("secaoId");

-- CreateIndex
CREATE INDEX "arquivos_tcc_enviadoPorId_criadoEm_idx" ON "arquivos_tcc"("enviadoPorId", "criadoEm");

-- AddForeignKey
ALTER TABLE "versoes_modelos_institucionais" ADD CONSTRAINT "versoes_modelos_institucionais_modeloInstitucionalId_fkey" FOREIGN KEY ("modeloInstitucionalId") REFERENCES "modelos_institucionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projetos_tcc" ADD CONSTRAINT "projetos_tcc_versaoModeloId_fkey" FOREIGN KEY ("versaoModeloId") REFERENCES "versoes_modelos_institucionais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autores_tcc" ADD CONSTRAINT "autores_tcc_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "projetos_tcc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_projeto_tcc" ADD CONSTRAINT "membros_projeto_tcc_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "projetos_tcc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_projeto_tcc" ADD CONSTRAINT "membros_projeto_tcc_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secoes_tcc" ADD CONSTRAINT "secoes_tcc_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "projetos_tcc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secoes_tcc" ADD CONSTRAINT "secoes_tcc_secaoPaiId_fkey" FOREIGN KEY ("secaoPaiId") REFERENCES "secoes_tcc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versoes_secoes_tcc" ADD CONSTRAINT "versoes_secoes_tcc_secaoId_fkey" FOREIGN KEY ("secaoId") REFERENCES "secoes_tcc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versoes_secoes_tcc" ADD CONSTRAINT "versoes_secoes_tcc_autorUsuarioId_fkey" FOREIGN KEY ("autorUsuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_secoes_tcc" ADD CONSTRAINT "comentarios_secoes_tcc_secaoId_fkey" FOREIGN KEY ("secaoId") REFERENCES "secoes_tcc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_secoes_tcc" ADD CONSTRAINT "comentarios_secoes_tcc_autorUsuarioId_fkey" FOREIGN KEY ("autorUsuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos_tcc" ADD CONSTRAINT "arquivos_tcc_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "projetos_tcc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos_tcc" ADD CONSTRAINT "arquivos_tcc_secaoId_fkey" FOREIGN KEY ("secaoId") REFERENCES "secoes_tcc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos_tcc" ADD CONSTRAINT "arquivos_tcc_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
