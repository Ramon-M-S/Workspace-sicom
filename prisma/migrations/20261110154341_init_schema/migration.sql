-- CreateTable
CREATE TABLE "fases" (
    "id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "fases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapas" (
    "id" TEXT NOT NULL,
    "faseId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "entregaveis" TEXT[],
    "dod" TEXT[],
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "specKit" TEXT,

    CONSTRAINT "etapas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anotacoes" (
    "id" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anotacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lembretes" (
    "id" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "diasAntes" INTEGER NOT NULL,
    "canal" TEXT NOT NULL DEFAULT 'ambos',
    "enviado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lembretes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "etapas_faseId_ordem_idx" ON "etapas"("faseId", "ordem");

-- CreateIndex
CREATE INDEX "lembretes_etapaId_enviado_idx" ON "lembretes"("etapaId", "enviado");

-- AddForeignKey
ALTER TABLE "etapas" ADD CONSTRAINT "etapas_faseId_fkey" FOREIGN KEY ("faseId") REFERENCES "fases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacoes" ADD CONSTRAINT "anotacoes_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembretes" ADD CONSTRAINT "lembretes_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
