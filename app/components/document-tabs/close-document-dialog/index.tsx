"use client";

import { AlertTriangle } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CloseDocumentDialogProps = {
  open: boolean;
  documentTitle: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export default function CloseDocumentDialog({
  open,
  documentTitle,
  onOpenChange,
  onConfirm,
}: CloseDocumentDialogProps) {
  const handleConfirm = useCallback(() => {
    onConfirm();
    onOpenChange(false);
  }, [onConfirm, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle>Fechar documento</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja fechar o documento{" "}
            <strong className="font-bold text-black">{documentTitle}</strong>? O
            arquivo não será apagado e poderá ser aberto novamente em "Ver
            documentos".
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Fechar documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
