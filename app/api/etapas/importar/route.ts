import { created, handleError } from "@/lib/http";
import { getUsuarioLogado } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { importarCronogramaSchema } from "@/lib/validations/importar";

export async function POST(request: Request) {
  try {
    const usuarioId = await getUsuarioLogado();
    const cronograma = importarCronogramaSchema.parse(await request.json());

    const contagem = await prisma.$transaction(async (tx) => {
      const ultimaFase = await tx.fase.findFirst({
        where: { usuarioId },
        orderBy: { ordem: "desc" },
        select: { ordem: true },
      });
      let fasesCriadas = 0;
      let etapasCriadas = 0;

      for (let indiceFase = 0; indiceFase < cronograma.fases.length; indiceFase += 1) {
        const faseScript = cronograma.fases[indiceFase];
        const faseId = `${usuarioId}:fase-${crypto.randomUUID()}`;
        await tx.fase.create({
          data: {
            id: faseId,
            usuarioId,
            nome: faseScript.nome,
            ordem: (ultimaFase?.ordem ?? -1) + indiceFase + 1,
          },
        });
        fasesCriadas += 1;

        for (let ordem = 0; ordem < faseScript.etapas.length; ordem += 1) {
          const etapaScript = faseScript.etapas[ordem];
          const etapaId = `${usuarioId}:etapa-${crypto.randomUUID()}`;
          await tx.etapa.create({
            data: {
              id: etapaId,
              usuarioId,
              faseId,
              ordem,
              titulo: etapaScript.titulo,
              objetivo: etapaScript.objetivo,
              inicio: etapaScript.inicio,
              fim: etapaScript.fim,
              status: etapaScript.status,
              progresso: etapaScript.status === "concluida" ? 100 : 0,
              entregaveis: etapaScript.entregaveis,
              dod: etapaScript.dod,
              lembretes: {
                create: [7, 1, 0].map((diasAntes) => ({
                  id: `${etapaId}-lembrete-${diasAntes}`,
                  diasAntes,
                  canal: "ambos",
                  enviado: false,
                })),
              },
            },
          });
          etapasCriadas += 1;
        }
      }

      return { fasesCriadas, etapasCriadas };
    });

    return created({ sucesso: true, ...contagem });
  } catch (error) {
    return handleError(error);
  }
}
