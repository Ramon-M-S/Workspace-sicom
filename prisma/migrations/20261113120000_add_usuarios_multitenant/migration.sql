-- Preserve existing SICOM data by assigning it to an initial owner.
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

INSERT INTO "usuarios" ("id", "nome", "email", "senhaHash", "criadoEm")
VALUES ('sicom-legacy-owner', 'Usuário inicial', 'inicial@sicom.local', '!REDEFINIR_SENHA!', CURRENT_TIMESTAMP);

ALTER TABLE "fases" ADD COLUMN "usuarioId" TEXT;
ALTER TABLE "etapas" ADD COLUMN "usuarioId" TEXT;
ALTER TABLE "anotacoes" ADD COLUMN "usuarioId" TEXT;
ALTER TABLE "anexos" ADD COLUMN "usuarioId" TEXT;
ALTER TABLE "log_alteracoes" ADD COLUMN "usuarioId" TEXT;
ALTER TABLE "configuracoes" ADD COLUMN "usuarioId" TEXT;

UPDATE "fases" SET "usuarioId" = 'sicom-legacy-owner';
UPDATE "etapas" SET "usuarioId" = 'sicom-legacy-owner';
UPDATE "anotacoes" SET "usuarioId" = 'sicom-legacy-owner';
UPDATE "anexos" SET "usuarioId" = 'sicom-legacy-owner';
UPDATE "log_alteracoes" SET "usuarioId" = 'sicom-legacy-owner';
UPDATE "configuracoes" SET "usuarioId" = 'sicom-legacy-owner';

ALTER TABLE "fases" ALTER COLUMN "usuarioId" SET NOT NULL;
ALTER TABLE "etapas" ALTER COLUMN "usuarioId" SET NOT NULL;
ALTER TABLE "anotacoes" ALTER COLUMN "usuarioId" SET NOT NULL;
ALTER TABLE "anexos" ALTER COLUMN "usuarioId" SET NOT NULL;
ALTER TABLE "log_alteracoes" ALTER COLUMN "usuarioId" SET NOT NULL;
ALTER TABLE "configuracoes" ALTER COLUMN "usuarioId" SET NOT NULL;

ALTER TABLE "configuracoes" DROP CONSTRAINT "configuracoes_pkey";
ALTER TABLE "configuracoes" ALTER COLUMN "id" DROP DEFAULT;
CREATE UNIQUE INDEX "configuracoes_usuarioId_key" ON "configuracoes"("usuarioId");
ALTER TABLE "configuracoes" ADD CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id");

ALTER TABLE "fases" ADD CONSTRAINT "fases_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "etapas" ADD CONSTRAINT "etapas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "anotacoes" ADD CONSTRAINT "anotacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "log_alteracoes" ADD CONSTRAINT "log_alteracoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "configuracoes" ADD CONSTRAINT "configuracoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
