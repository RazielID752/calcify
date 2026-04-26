"use client";

import {
  BookOpenText,
  CheckCircle2,
  Keyboard,
  Layers3,
  Sparkles,
  Wand2,
} from "lucide-react";
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
  const keyboardShortcuts = [
    {
      platformIcon: "⊞",
      platformLabel: "Windows",
      keys: ["Ctrl", "Shift", "M"],
      description: "Renderiza Markdown manualmente.",
    },
    {
      platformIcon: "⌘",
      platformLabel: "Apple",
      keys: ["Cmd", "Shift", "M"],
      description: "Mesmo atalho no macOS.",
    },
    { keys: ["Tab"], description: "Insere indentação dentro do editor." },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100svh-1rem)] w-[calc(100%-1rem)] flex-col overflow-hidden p-0 sm:max-h-[calc(100svh-2rem)] sm:w-[calc(100%-2rem)] sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-zinc-200/80 bg-zinc-50/70 px-4 py-4 sm:px-6 sm:py-5">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <BookOpenText className="size-4.5" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-zinc-900">
                Guia profissional do editor
              </p>
              <p className="text-sm font-normal text-zinc-600">
                Tudo que você precisa para escrever melhor, mais rápido e com
                consistência.
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Fluxo prático de uso diário com foco em produtividade e clareza.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto px-4 py-4 text-sm text-zinc-700 sm:px-6 sm:py-5">
          <section className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-900">
              <Sparkles className="size-4" />
              Comece em 30s
            </div>
            <p className="text-zinc-700">
              Comece pelo título ou pelo corpo, como preferir. O editor se
              adapta ao seu fluxo sem exigir ordem fixa.
            </p>
            <p className="mt-2 text-zinc-700">
              Arraste blocos pela alça lateral para reorganizar ideias com
              rapidez.
            </p>
          </section>

          <section className="rounded-xl border border-zinc-200/80 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold text-zinc-900">
              <Layers3 className="size-4 text-emerald-700" />
              Fluxo diário
            </div>
            <p>1. Crie ou selecione o documento na barra de abas.</p>
            <p>
              2. Escreva, formate e reorganize os blocos sem sair da página.
            </p>
            <p>3. Use o menu flutuante para salvar e exportar quando quiser.</p>
          </section>

          <section className="rounded-xl border border-zinc-200/80 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold text-zinc-900">
              <Wand2 className="size-4 text-emerald-700" />
              Formatação essencial
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <p className="rounded-md bg-zinc-50 px-3 py-2">
                Markdown e rich text no mesmo fluxo.
              </p>
              <p className="rounded-md bg-zinc-50 px-3 py-2">
                Suporte rápido para listas, citações e código.
              </p>
              <p className="rounded-md bg-zinc-50 px-3 py-2">
                Inserção de links e imagens diretamente pela toolbar.
              </p>
              <p className="rounded-md bg-zinc-50 px-3 py-2">
                Renderização manual de Markdown quando necessário.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200/80 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-zinc-900">
              <Keyboard className="size-4 text-emerald-700" />
              Atalhos para aumentar a Produtividade
            </div>
            <div className="space-y-2">
              {keyboardShortcuts.map((shortcut) => (
                <div
                  key={`${shortcut.keys.join("-")}-${shortcut.description}`}
                  className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-wrap items-center gap-1">
                    {"platformIcon" in shortcut ? (
                      <span
                        title={shortcut.platformLabel}
                        className="mr-1 inline-flex h-6 items-center justify-center gap-1 rounded border border-zinc-300 bg-white px-2 text-xs font-semibold text-zinc-700"
                      >
                        {shortcut.platformIcon}
                        <span>{shortcut.platformLabel}</span>
                      </span>
                    ) : null}
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={`${shortcut.description}-${key}`}
                        className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs font-semibold text-zinc-700"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-600 sm:text-sm">
                    {shortcut.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
            <div className="flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="size-4" />
              <p className="font-semibold">Pronto para começar</p>
            </div>
            <p className="mt-2 text-sm text-emerald-900/90">
              Feche este guia e comece a escrever. Você pode voltar às
              instruções a qualquer momento pelo botão de Ajuda.
            </p>
          </section>
        </div>

        <DialogFooter className="shrink-0 border-t border-zinc-200/80 bg-white px-4 py-4 sm:px-6">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Começar a escrever
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
