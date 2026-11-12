"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gerarRelatorioPdf, type EtapaRelatorio, type FaseRelatorio } from "@/lib/gerar-pdf";

export function BotaoExportarPdf({ etapas, fases }: { etapas: EtapaRelatorio[]; fases: FaseRelatorio[] }) {
  return (
    <Button variant="outline" onClick={() => gerarRelatorioPdf(etapas, fases)}>
      <Download className="h-4 w-4" />
      Exportar PDF
    </Button>
  );
}
