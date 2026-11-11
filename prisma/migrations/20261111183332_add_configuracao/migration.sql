-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "nomeProjeto" TEXT NOT NULL DEFAULT 'TCC - SICOM',
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataDefesa" TIMESTAMP(3),
    "emailLembrete" TEXT,
    "ativoLembretes" BOOLEAN NOT NULL DEFAULT true,
    "diasAntecedencia" INTEGER NOT NULL DEFAULT 7,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);
