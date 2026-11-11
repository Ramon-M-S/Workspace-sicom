import { NextResponse } from "next/server";
import { enviarEmailLembrete } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    cronSecret !== undefined &&
    request.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  try {
    const configuracao = await prisma.configuracao.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });
    if (!configuracao.ativoLembretes) {
      return NextResponse.json({ enviados: 0, mensagem: "Desativado" });
    }

    const emailDestino = configuracao.emailLembrete || process.env.LEMBRETE_EMAIL_DESTINO;
    const smtpObrigatorias = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"];
    const smtpAusentes = smtpObrigatorias.filter((variavel) => !process.env[variavel]);
    if (smtpAusentes.length) {
      return NextResponse.json(
        { erro: `Configure as variáveis SMTP no ambiente: ${smtpAusentes.join(", ")}.` },
        { status: 500 },
      );
    }
    if (!emailDestino) {
      return NextResponse.json({ erro: "Configure LEMBRETE_EMAIL_DESTINO no ambiente." }, { status: 500 });
    }

    // Valida SMTP antes de processar os lembretes para responder com erro claro de configuração.
    const pendentes = await prisma.lembrete.findMany({
      where: { enviado: false },
      include: { etapa: { select: { id: true, titulo: true, fim: true, objetivo: true } } },
    });
    let enviados = 0;
    let falhas = 0;
    const agora = new Date();

    for (const lembrete of pendentes) {
      const dataEnvio = new Date(
        lembrete.etapa.fim.getTime() - lembrete.diasAntes * 24 * 60 * 60 * 1000,
      );
      if (agora < dataEnvio) continue;

      try {
        await enviarEmailLembrete(lembrete.etapa, emailDestino, lembrete.diasAntes);
        await prisma.lembrete.update({ where: { id: lembrete.id }, data: { enviado: true } });
        enviados++;
      } catch (error) {
        falhas++;
        console.error(`Falha ao enviar lembrete ${lembrete.id}:`, error);
      }
    }

    return NextResponse.json({ enviados, falhas });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro inesperado ao executar lembretes.";
    return NextResponse.json({ erro: mensagem, enviados: 0, falhas: 0 }, { status: 500 });
  }
}
