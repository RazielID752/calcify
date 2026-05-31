"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkUrl: string;
  onLinkUrlChange: (value: string) => void;
  openInNewTab: boolean;
  onOpenInNewTabChange: (value: boolean) => void;
  onApplyLink: () => void;
  onRemoveLink: () => void;
};

export default function LinkDialog({
  open,
  onOpenChange,
  linkUrl,
  onLinkUrlChange,
  openInNewTab,
  onOpenInNewTabChange,
  onApplyLink,
  onRemoveLink,
}: LinkDialogProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApplyLink();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar link</DialogTitle>
            <DialogDescription>
              Informe a URL e escolha se deve abrir em nova aba.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="editor-link-url"
              className="text-sm font-medium text-zinc-800"
            >
              URL
            </label>
            <input
              id="editor-link-url"
              type="url"
              value={linkUrl}
              onChange={(event) => onLinkUrlChange(event.target.value)}
              placeholder="https://exemplo.com"
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              autoFocus
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={openInNewTab}
              onChange={(event) => onOpenInNewTabChange(event.target.checked)}
              className="size-4 rounded border-zinc-300"
            />
            Abrir em nova aba
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:text-red-700"
              onClick={onRemoveLink}
            >
              Remover link
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Aplicar link</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
