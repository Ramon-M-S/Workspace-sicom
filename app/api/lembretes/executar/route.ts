import { NextResponse } from "next/server";
import { enviarEmailLembrete } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth-utils";

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const requisicaoCronAutorizada = Boolean(
    cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`,
  );
  if (
    cronSecret !== undefined &&
    !requisicaoCronAutorizada
  ) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  try {
    const usuarioId = requisicaoCronAutorizada ? undefined : await getUsuarioLogado();
    const configuracoes = await prisma.configuracao.findMany({
      where: { ativoLembretes: true, ...(usuarioId ? { usuarioId } : {}) },
    });
    if (configuracoes.length === 0) {
      return NextResponse.json({ enviados: 0, mensagem: "Desativado" });
    }

    const smtpObrigatorias = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"];
    const smtpAusentes = smtpObrigatorias.filter((variavel) => !process.env[variavel]);
    if (smtpAusentes.length) {
      return NextResponse.json(
        { erro: `Configure as variáveis SMTP no ambiente: ${smtpAusentes.join(", ")}.` },
        { status: 500 },
      );
    }
    // Valida SMTP antes de processar os lembretes para responder com erro claro de configuração.
    let enviados = 0;
    let falhas = 0;
    const agora = new Date();

    for (const configuracao of configuracoes) {
      const emailDestino = configuracao.emailLembrete || process.env.LEMBRETE_EMAIL_DESTINO;
      if (!emailDestino) {
        console.error(`Sem destinatário de lembrete para usuário ${configuracao.usuarioId}.`);
        falhas++;
        continue;
      }
      const pendentes = await prisma.lembrete.findMany({
        where: { enviado: false, etapa: { usuarioId: configuracao.usuarioId } },
        include: { etapa: { select: { id: true, titulo: true, fim: true, objetivo: true } } },
      });

      for (const lembrete of pendentes) {
        const dataEnvio = new Date(lembrete.etapa.fim.getTime() - lembrete.diasAntes * 24 * 60 * 60 * 1000);
        if (agora < dataEnvio) continue;
        try {
          await enviarEmailLembrete(lembrete.etapa, emailDestino, lembrete.diasAntes);
          await prisma.lembrete.updateMany({
            where: { id: lembrete.id, etapa: { usuarioId: configuracao.usuarioId } },
            data: { enviado: true },
          });
          enviados++;
        } catch (error) {
          falhas++;
          console.error(`Falha ao enviar lembrete ${lembrete.id}:`, error);
        }
      }
    }

    return NextResponse.json({ enviados, falhas });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro inesperado ao executar lembretes.";
    return NextResponse.json({ erro: mensagem, enviados: 0, falhas: 0 }, { status: 500 });
  }
}
