import "dotenv/config";
import { executarSeed } from "./seed";
import { prisma } from "../lib/prisma";

executarSeed()
  .catch((error: unknown) => {
    console.error("Erro ao executar o seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
