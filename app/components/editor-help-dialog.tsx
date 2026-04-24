"use client";

import { BookOpenText, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EditorHelpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function EditorHelpDialog({
  open,
  onOpenChange,
}: EditorHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpenText className="size-5 text-emerald-600" />
            Guia rápido do editor
          </DialogTitle>
          <DialogDescription>
            Um resumo prático para escrever, formatar e reorganizar conteúdos
            sem quebrar o fluxo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm text-zinc-700">
          <section className="space-y-2">
            <h3 className="font-semibold text-zinc-900">Primeiros passos</h3>
            <p>Clique no título ou direto no corpo para começar a digitar.</p>
            <p>
              Você pode deixar o título vazio e preencher o conteúdo primeiro.
            </p>
            <p>Arraste a alça lateral para mover blocos acima ou abaixo.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-zinc-900">Atalhos úteis</h3>
            <p>`Tab` agora insere indentação dentro do editor.</p>
            <p>
              `Ctrl` ou `Cmd` + `Shift` + `M` renderiza Markdown manualmente.
            </p>
            <p>`Enter` em uma citação cria um parágrafo normal logo abaixo.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-zinc-900">Formatação</h3>
            <p>O botão de citação funciona como liga/desliga no bloco atual.</p>
            <p>Ao colar HTML, listas e estrutura visual são preservadas.</p>
            <p>
              Cálculos podem continuar na mesma linha usando o último resultado.
            </p>
          </section>

          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <div className="flex items-center gap-2 font-semibold">
              <LifeBuoy className="size-4" />
              Ajuda e suporte
            </div>
            <p className="mt-2">
              Use o botão <strong>Ajuda</strong> da barra superior sempre que
              precisar consultar o guia rápido do editor.
            </p>
          </section>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Fechar guia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
