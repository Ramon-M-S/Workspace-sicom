"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Anexo } from "@/lib/generated/prisma/client";

type AnexoEtapa = Omit<Anexo, "criadoEm"> & { criadoEm: string };
type EtapaComAnexos = { id: string; anexos: AnexoEtapa[] };

function formatarTamanho(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function mensagemErro(response: Response) {
  const dados: unknown = await response.json().catch(() => null);
  return typeof dados === "object" && dados !== null && "error" in dados &&
    typeof dados.error === "string"
    ? dados.error
    : "Não foi possível concluir a operação.";
}

export function AnexosEtapa({ etapa }: { etapa: EtapaComAnexos }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivos, setArquivos] = useState(etapa.anexos);
  const [enviando, setEnviando] = useState(false);
  const [anexoParaExcluir, setAnexoParaExcluir] = useState<string | null>(null);

  async function anexarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;

    const formData = new FormData();
    formData.append("file", arquivo);
    setEnviando(true);
    try {
      const response = await fetch(`/api/etapas/${etapa.id}/anexos`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(await mensagemErro(response));
      const novoAnexo = (await response.json()) as AnexoEtapa;
      setArquivos((atuais) => [novoAnexo, ...atuais]);
      toast.success("Arquivo anexado com sucesso.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao anexar arquivo.");
    } finally {
      setEnviando(false);
    }
  }

  async function excluirAnexo() {
    if (!anexoParaExcluir) return;
    setEnviando(true);
    try {
      const response = await fetch(`/api/anexos/${anexoParaExcluir}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await mensagemErro(response));
      setArquivos((atuais) => atuais.filter((anexo) => anexo.id !== anexoParaExcluir));
      setAnexoParaExcluir(null);
      toast.success("Anexo excluído.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir anexo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Anexos ({arquivos.length})</CardTitle>
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
              onChange={anexarArquivo}
            />
            <Button
              type="button"
              variant="outline"
              disabled={enviando}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Anexar arquivo
            </Button>
          </>
        </CardHeader>
        <CardContent>
          {arquivos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum arquivo anexado.</p>
          ) : (
            <ul className="space-y-3">
              {arquivos.map((anexo) => {
                const ehImagem = anexo.tipo.startsWith("image/");
                const Icone = ehImagem ? ImageIcon : FileText;
                return (
                  <li key={anexo.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Icone className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <a
                        href={anexo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm font-medium hover:underline"
                      >
                        {anexo.nome}
                      </a>
                      <p className="text-xs text-muted-foreground">{formatarTamanho(anexo.tamanho)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${anexo.nome}`}
                      disabled={enviando}
                      onClick={() => setAnexoParaExcluir(anexo.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={anexoParaExcluir !== null}
        onOpenChange={(aberto) => { if (!aberto) setAnexoParaExcluir(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir anexo?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O arquivo será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={enviando} onClick={() => setAnexoParaExcluir(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" disabled={enviando} onClick={excluirAnexo}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
