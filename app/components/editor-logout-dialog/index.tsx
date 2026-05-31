"use client";

import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EditorLogoutDialogProps = {
  open: boolean;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmLogout: () => void;
};

export default function EditorLogoutDialog({
  open,
  isSubmitting = false,
  onOpenChange,
  onConfirmLogout,
}: EditorLogoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle>Sair da conta</DialogTitle>
          <DialogDescription>
            Deseja realmente deslogar? Seus dados de sessão serão removidos
            deste navegador.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={onConfirmLogout}
          >
            <LogOut className="size-4" />
            {isSubmitting ? "Saindo..." : "Sair da conta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
