type EtapaGoogle = {
  id: string;
  titulo: string;
  objetivo: string;
  inicio: Date;
  fim: Date;
  entregaveis: string[];
};

type EtapaIcs = EtapaGoogle & {
  dod: string[];
};

function formatarDataUtc(data: Date): string {
  const doisDigitos = (valor: number) => String(valor).padStart(2, "0");

  return `${data.getUTCFullYear()}${doisDigitos(data.getUTCMonth() + 1)}${doisDigitos(data.getUTCDate())}T${doisDigitos(data.getUTCHours())}${doisDigitos(data.getUTCMinutes())}${doisDigitos(data.getUTCSeconds())}Z`;
}

export function gerarLinkGoogleAgenda(etapa: EtapaGoogle): string {
  const details = `${etapa.objetivo}\n\nEntregáveis:\n- ${etapa.entregaveis.join("\n- ")}`;
  const params = [
    "action=TEMPLATE",
    `text=TCC+SICOM+-+${encodeURIComponent(etapa.titulo)}`,
    `dates=${formatarDataUtc(etapa.inicio)}/${formatarDataUtc(etapa.fim)}`,
    `details=${encodeURIComponent(details)}`,
    `location=${encodeURIComponent("IFMA - São Luís")}`,
  ];

  return `https://calendar.google.com/calendar/render?${params.join("&")}`;
}

function escaparIcs(valor: string): string {
  return valor
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function dobrarLinha(linha: string): string {
  const partes: string[] = [];
  let parte = "";
  let bytesNaParte = 0;

  for (const caractere of linha) {
    const bytes = new TextEncoder().encode(caractere).length;
    const limite = partes.length === 0 ? 75 : 74;

    if (bytesNaParte + bytes > limite) {
      partes.push(parte);
      parte = caractere;
      bytesNaParte = bytes;
    } else {
      parte += caractere;
      bytesNaParte += bytes;
    }
  }

  partes.push(parte);
  return partes.map((item, indice) => (indice === 0 ? item : ` ${item}`)).join("\r\n");
}

export function gerarIcs(etapa: EtapaIcs): string {
  const descricao = [
    etapa.objetivo,
    "",
    "Entregáveis:",
    etapa.entregaveis.join(", "),
    "",
    "DoD:",
    etapa.dod.join(", "),
  ].join("\n");

  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SICOM TCC//PT-BR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${etapa.id}@sicom.tcc`,
    `DTSTAMP:${formatarDataUtc(new Date())}`,
    `DTSTART:${formatarDataUtc(etapa.inicio)}`,
    `DTEND:${formatarDataUtc(etapa.fim)}`,
    `SUMMARY:${escaparIcs(`TCC SICOM - ${etapa.titulo}`)}`,
    `DESCRIPTION:${escaparIcs(descricao)}`,
    `LOCATION:${escaparIcs("IFMA - São Luís")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${linhas.map(dobrarLinha).join("\r\n")}\r\n`;
}
