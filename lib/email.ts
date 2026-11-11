import nodemailer from "nodemailer";

type EtapaLembrete = { id?: string; titulo: string; fim: Date; objetivo: string };

const smtpConfig = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  const missing = [
    ["SMTP_HOST", SMTP_HOST],
    ["SMTP_PORT", SMTP_PORT],
    ["SMTP_USER", SMTP_USER],
    ["SMTP_PASS", SMTP_PASS],
    ["SMTP_FROM", SMTP_FROM],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missing.length) throw new Error(`Configuração SMTP ausente: ${missing.join(", ")}`);
  const port = Number(SMTP_PORT);
  if (!Number.isInteger(port) || port <= 0) throw new Error("SMTP_PORT deve ser uma porta válida.");
  return { host: SMTP_HOST!, port, secure: port === 465, auth: { user: SMTP_USER!, pass: SMTP_PASS! }, from: SMTP_FROM! };
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export async function enviarEmailLembrete(
  etapa: EtapaLembrete,
  emailDestino: string,
  diasAntes: number,
) {
  const config = smtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.auth.user, pass: config.auth.pass },
  });
  const titulo = escapeHtml(etapa.titulo);
  const objetivo = escapeHtml(etapa.objetivo);
  const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(etapa.fim);
  const href = `http://localhost:3000/etapas${etapa.id ? `/${encodeURIComponent(etapa.id)}` : ""}`;
  const assunto = diasAntes === 0
    ? `🚨 HOJE: Etapa ${etapa.titulo} vence hoje`
    : `⚠️ Lembrete: Etapa ${etapa.titulo} vence em ${diasAntes} dias`;

  await transporter.sendMail({
    from: config.from,
    to: emailDestino,
    subject: assunto,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:24px auto;padding:32px;color:#1f2937;background:#f8fafc;border-radius:16px"><p style="color:#64748b">Lembrete de etapa</p><h1 style="font-size:24px">${titulo}</h1><p><strong>Vencimento:</strong> ${data}</p><p><strong>Objetivo:</strong> ${objetivo}</p><a href="${href}" style="display:inline-block;margin-top:16px;padding:12px 18px;background:#2563eb;color:white;text-decoration:none;border-radius:8px">Abrir etapa</a></div>`,
  });
}
