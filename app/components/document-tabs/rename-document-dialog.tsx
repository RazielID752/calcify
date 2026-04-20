"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type RenameDocumentDialogProps = {
  open: boolean;
  initialTitle: string;
  defaultDocumentTitle: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (title: string) => void;
};

export default function RenameDocumentDialog({
  open,
  initialTitle,
  defaultDocumentTitle,
  onOpenChange,
  onConfirm,
}: RenameDocumentDialogProps) {
  const [renameTitle, setRenameTitle] = useState("");
  const renameTitleValue = useMemo(() => renameTitle.trim(), [renameTitle]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setRenameTitle(initialTitle);
  }, [initialTitle, open]);

  const handleConfirmRename = useCallback(() => {
    onConfirm(renameTitleValue || defaultDocumentTitle);
  }, [defaultDocumentTitle, onConfirm, renameTitleValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renomear documento</DialogTitle>
          <DialogDescription>
            Escolha um novo nome para a aba selecionada.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleConfirmRename();
          }}
        >
          <Input
            value={renameTitle}
            onChange={(event) => setRenameTitle(event.target.value)}
            placeholder={defaultDocumentTitle}
            aria-label="Novo nome do documento"
            autoFocus
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar nome</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
