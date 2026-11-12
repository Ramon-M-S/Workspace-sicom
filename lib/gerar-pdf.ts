import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type EtapaRelatorio = {
  id: string;
  titulo: string;
  faseId: string;
  inicio: string | Date;
  fim: string | Date;
  status: string;
  progresso: number;
};

export type FaseRelatorio = {
  id: string;
  nome: string;
  ordem?: number;
};

const statusLabel: Record<string, string> = {
  concluida: "Concluída",
  em_andamento: "Em andamento",
  pendente: "Pendente",
};

function formatarData(data: string | Date) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data));
}

export function gerarRelatorioPdf(etapas: EtapaRelatorio[], fases: FaseRelatorio[]) {
  const doc = new jsPDF({ orientation: "portrait", format: "a4" });
  const margem = 14;
  const largura = doc.internal.pageSize.getWidth();
  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const atrasada = (etapa: EtapaRelatorio) =>
    new Date(etapa.fim) < inicioHoje && etapa.status !== "concluida";

  doc.setFontSize(16);
  doc.text("Relatório de Progresso - TCC SICOM", margem, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Data: ${formatarData(hoje)}`, margem, 27);

  const resumo = [
    ["Total de etapas", String(etapas.length)],
    ["Concluídas", String(etapas.filter((etapa) => etapa.status === "concluida").length)],
    ["Em andamento", String(etapas.filter((etapa) => etapa.status === "em_andamento").length)],
    ["Pendentes", String(etapas.filter((etapa) => etapa.status === "pendente").length)],
    ["Atrasadas", String(etapas.filter(atrasada).length)],
  ];
  autoTable(doc, {
    startY: 33,
    head: [["Resumo geral", "Quantidade"]],
    body: resumo,
    theme: "grid",
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
    margin: { left: margem, right: margem },
  });

  let y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 33;
  const fasesOrdenadas = [...fases].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  for (const fase of fasesOrdenadas) {
    const etapasDaFase = etapas.filter((etapa) => etapa.faseId === fase.id);
    if (y + 18 > doc.internal.pageSize.getHeight() - margem) {
      doc.addPage();
      y = margem;
    }
    y += 10;
    doc.setFontSize(13);
    doc.setTextColor(30);
    doc.text(fase.nome, margem, y);

    autoTable(doc, {
      startY: y + 3,
      head: [["Etapa", "Status", "Início", "Fim", "Progresso"]],
      body: etapasDaFase.map((etapa) => [
        etapa.titulo,
        statusLabel[etapa.status] ?? etapa.status,
        formatarData(etapa.inicio),
        formatarData(etapa.fim),
        `${etapa.progresso}%`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
      margin: { left: margem, right: margem },
      tableWidth: largura - margem * 2,
      styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
      columnStyles: { 0: { cellWidth: 75 }, 1: { cellWidth: 32 }, 2: { cellWidth: 25 }, 3: { cellWidth: 25 }, 4: { cellWidth: "auto" } },
      didParseCell(data) {
        if (data.section === "body" && etapasDaFase[data.row.index] && atrasada(etapasDaFase[data.row.index])) {
          data.cell.styles.fillColor = [255, 220, 220];
        }
      },
    });
    y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  }

  const totalPaginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      "Gerado por SICOM - Sistema de Gestão de TCC",
      margem,
      doc.internal.pageSize.getHeight() - 8,
    );
    doc.text(
      `Página ${pagina} de ${totalPaginas}`,
      largura - margem,
      doc.internal.pageSize.getHeight() - 8,
      { align: "right" },
    );
  }

  const dataArquivo = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  doc.save(`relatorio-tcc-${dataArquivo}.pdf`);
}
