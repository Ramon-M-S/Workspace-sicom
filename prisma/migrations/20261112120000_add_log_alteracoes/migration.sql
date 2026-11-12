CREATE TABLE "log_alteracoes" (
    "id" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "campo" TEXT,
    "valorAntigo" TEXT,
    "valorNovo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_alteracoes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "log_alteracoes"
ADD CONSTRAINT "log_alteracoes_etapaId_fkey"
FOREIGN KEY ("etapaId") REFERENCES "etapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
