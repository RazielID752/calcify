"use client";

import { FileText, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EditorImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportMarkdown: (markdown: string) => void;
};

const ACCEPTED_EXTENSIONS = [".md", ".markdown", ".txt"];
const ACCEPTED_MIME_TYPES = ["text/markdown", "text/plain", "text/x-markdown"];

const hasSupportedExtension = (fileName: string) =>
  ACCEPTED_EXTENSIONS.some((extension) =>
    fileName.toLowerCase().endsWith(extension),
  );

const isSupportedFile = (file: File) =>
  hasSupportedExtension(file.name) ||
  ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase());

export default function EditorImportDialog({
  open,
  onOpenChange,
  onImportMarkdown,
}: EditorImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setIsDragActive(false);
      setSelectedFile(null);
      setErrorMessage("");
    }
  }, [open]);

  const acceptedFilesLabel = useMemo(() => ACCEPTED_EXTENSIONS.join(", "), []);

  const selectFile = useCallback((file: File | null) => {
    if (!file) {
      return;
    }

    if (!isSupportedFile(file)) {
      setSelectedFile(null);
      setErrorMessage(
        `Arquivo não suportado. Use ${ACCEPTED_EXTENSIONS.join(", ")}.`,
      );
      return;
    }

    setSelectedFile(file);
    setErrorMessage("");
  }, []);

  const handleImport = useCallback(async () => {
    if (!selectedFile) {
      return;
    }

    const markdown = await selectedFile.text();
    onImportMarkdown(markdown);
    onOpenChange(false);
  }, [onImportMarkdown, onOpenChange, selectedFile]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-4.5 text-emerald-700" />
            Importar arquivo Markdown
          </DialogTitle>
          <DialogDescription className="pb-2">
            Arraste um arquivo para a área abaixo ou clique para selecionar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <button
            type="button"
            className={`w-full rounded-xl border-2 border-dashed p-5 text-left transition-colors ${
              isDragActive
                ? "border-emerald-400 bg-emerald-50"
                : "border-zinc-300 bg-zinc-50 hover:border-emerald-300 hover:bg-emerald-50/40"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragActive(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragActive(false);
              const file = event.dataTransfer.files?.[0] ?? null;
              selectFile(file);
            }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-emerald-100 p-2 text-emerald-700">
                <FileText className="size-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-900">
                  Arraste e solte o arquivo aqui
                </p>
                <p className="text-xs text-zinc-600">
                  Ou clique para buscar no seu computador.
                </p>
                <p className="pt-1 text-xs text-zinc-500">
                  Formatos suportados: {acceptedFilesLabel}
                </p>
              </div>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(",")}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              selectFile(file);
              event.target.value = "";
            }}
          />

          {selectedFile ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              Arquivo selecionado: <strong>{selectedFile.name}</strong>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" disabled={!selectedFile} onClick={handleImport}>
            Importar arquivo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
