"use client";

import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import {
  type DocumentTitleFormValues,
  documentTitleDefaultValues,
  documentTitleFormSchema,
} from "@/app/forms/document";

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
  const {
	register,
	handleSubmit,
	reset,
	formState: { errors },
  } = useForm<DocumentTitleFormValues>({
	defaultValues: documentTitleDefaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({ title: initialTitle });
  }, [initialTitle, open, reset]);

  const handleConfirmRename = useCallback(
    (values: DocumentTitleFormValues) => {
      onConfirm(values.title.trim() || defaultDocumentTitle);
      reset(documentTitleDefaultValues);
    },
    [defaultDocumentTitle, onConfirm, reset],
  );

  const submitRename = handleSubmit(handleConfirmRename);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle> Renomear documento</DialogTitle>
          <DialogDescription className="pb-2">
            Escolha um novo nome para a aba selecionada.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submitRename}>
          <Input
            placeholder={defaultDocumentTitle}
            aria-label="Novo nome do documento"
            autoFocus
            aria-invalid={errors.title ? "true" : "false"}
            {...register("title", documentTitleFormSchema.title)}
          />

          {errors.title ? (
            <p className="text-xs text-red-600">{errors.title.message}</p>
          ) : null}

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
