import "dotenv/config";
import { prisma } from "../lib/prisma";
import { executarSeed } from "./seed-logic";

export { executarSeed } from "./seed-logic";

async function main() {
  const usuario = await prisma.usuario.upsert({
    where: { email: "inicial@sicom.local" },
    update: {},
    create: {
      nome: "Usuário Inicial",
      email: "inicial@sicom.local",
      senhaHash: "senha-temporaria-sera-atualizada",
    },
  });

  await executarSeed(usuario.id);
}

main()
  .then(() => {
    console.log("Seed executado com sucesso.");
  })
  .catch((error: unknown) => {
    console.error("Erro ao executar seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
