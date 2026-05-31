"use client";

import { ImagePlus, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ImageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertImage: (src: string) => void;
  onRemoveImage: () => void;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result === "string") {
        resolve(result);
        return;
      }

      reject(new Error("Falha ao ler imagem."));
    };

    reader.onerror = () => reject(new Error("Falha ao ler imagem."));
    reader.readAsDataURL(file);
  });

export default function ImageDialog({
  open,
  onOpenChange,
  onInsertImage,
  onRemoveImage,
}: ImageDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      return;
    }

    setIsDragging(false);
    setPreviewSrc(null);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [open]);

  const handleSelectFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem valido.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPreviewSrc(dataUrl);
      setError(null);
    } catch {
      setError("Nao foi possivel carregar a imagem.");
    }
  };

  const handleOpenFilePicker = () => {
    inputRef.current?.click();
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    void handleSelectFile(droppedFile);
  };

  const handleApplyImage = () => {
    if (!previewSrc) {
      return;
    }

    onInsertImage(previewSrc);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar imagem</DialogTitle>
          <DialogDescription className="pb-3">
            Arraste uma imagem para a area abaixo ou clique para selecionar no
            explorador de arquivos.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            void handleSelectFile(selectedFile);
          }}
        />

        <button
          type="button"
          onClick={handleOpenFilePicker}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
            isDragging && "border-emerald-500 bg-emerald-50",
          )}
        >
          {previewSrc ? (
            <>
              <Image
                src={previewSrc}
                alt="Preview da imagem selecionada"
                width={800}
                height={450}
                unoptimized
                className="max-h-56 w-auto max-w-full rounded-lg object-contain"
              />
              <p className="text-xs text-zinc-500">
                Clique ou arraste outra imagem para substituir
              </p>
            </>
          ) : (
            <>
              <div className="rounded-full bg-white p-3 text-zinc-700 shadow-sm">
                {isDragging ? (
                  <Upload className="size-6" />
                ) : (
                  <ImagePlus className="size-6" />
                )}
              </div>
              <p className="text-sm font-medium text-zinc-800">
                Arraste a imagem aqui
              </p>
              <p className="text-xs text-zinc-500">
                ou clique para abrir o explorador de arquivos
              </p>
            </>
          )}
        </button>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            onClick={onRemoveImage}
          >
            Remover imagem da linha
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleApplyImage}
              disabled={!previewSrc}
            >
              Inserir imagem
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
