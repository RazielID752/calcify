"use client";

import {
  ArrowDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreHorizontal,
  PencilLine,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { DocumentApiResponse } from "@/app/interfaces/documents";
import {
  ApiRequestError,
  deleteDocumentWithApi,
  fetchDocumentsWithApi,
  isGuid,
  updateDocumentTitleWithApi,
} from "@/app/services/document.service";
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
import { cn } from "@/lib/utils";
import {
  DEFAULT_DOCUMENT_TITLE,
  type Document,
  hasMeaningfulEditorContent,
} from "../editor-document";

const PAGE_SIZE = 10;
const DOCUMENT_LIBRARY_SKELETON_ITEMS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
] as const;
const libraryDialogContentClassName =
  "flex h-[calc(100svh-1rem)] w-[calc(100%-1rem)] max-w-6xl flex-col overflow-hidden p-0 sm:h-auto sm:max-h-[calc(100svh-2rem)] sm:w-[calc(100%-2rem)]";
const libraryDialogBodyClassName =
  "grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[minmax(280px,360px)_1fr]";
const libraryListPaneClassName =
  "min-h-0 shrink-0 flex-col border-b border-zinc-200 md:shrink md:border-r md:border-b-0";
const libraryListClassName =
  "min-h-0 flex-1 overflow-y-auto p-2 md:min-h-[260px]";
const libraryPreviewPaneClassName = "relative min-h-0 flex-col";
const libraryMobilePreviewNavClassName =
  "flex shrink-0 border-b border-zinc-200/80 bg-white px-4 py-2 md:hidden";
const libraryPreviewContentClassName =
  "min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:min-h-[300px]";
const libraryScrollHintClassName =
  "pointer-events-none absolute bottom-32 left-1/2 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-zinc-500 shadow-sm md:hidden";
const libraryEmptyPreviewClassName =
  "hidden min-h-[360px] flex-1 items-center justify-center px-6 text-center text-sm text-zinc-500 md:flex";
const documentDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type LibraryDocument = Document & {
  isDraft?: boolean;
  source: "local" | "remote";
  updatedAt?: Date;
};

type DocumentLibraryDialogProps = {
  authToken: string | null;
  defaultDocumentTitle: string;
  documents: Document[];
  open: boolean;
  onDeleteOpenDocument: (documentId: string) => void;
  onAuthExpired: () => void;
  onOpenChange: (open: boolean) => void;
  onOpenDocument: (documentItem: Document) => void;
  onRenameDocument: (documentId: string, nextTitle: string) => void;
};

const toLibraryDocument = (item: DocumentApiResponse): LibraryDocument => ({
  id: item.id,
  clientDocumentId: item.clientDocumentId ?? null,
  title: item.title?.trim() || DEFAULT_DOCUMENT_TITLE,
  content: item.content ?? "",
  createdAt: new Date(item.createdAt),
  serverUpdatedAt: item.updatedAt,
  updatedAt: new Date(item.updatedAt),
  isDraft: item.isDraft,
  source: "remote",
  titleMode: "manual",
  isPersisted: true,
  isDirty: false,
  hasUserEdited: false,
  titleWasEditedByUser: false,
  contentWasEditedByUser: false,
});

const formatDate = (date: Date) => {
  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return documentDateFormatter.format(date);
};

const getPlainTextPreview = (html: string) => {
  if (!html) {
    return "Documento sem conteúdo.";
  }

  const container = document.createElement("div");
  container.innerHTML = html;
  const text = container.textContent?.replace(/\s+/g, " ").trim() ?? "";

  return text || "Documento sem conteúdo.";
};

const DocumentLibraryListSkeleton = () => (
  <output aria-label="Carregando documentos" className="block space-y-1">
    <span className="sr-only">Carregando documentos...</span>
    {DOCUMENT_LIBRARY_SKELETON_ITEMS.map((item) => (
      <div
        aria-hidden="true"
        className="flex animate-pulse items-center gap-2 rounded-md border border-transparent px-2 py-2"
        key={item}
      >
        <div className="size-4 shrink-0 rounded-sm bg-emerald-100" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3.5 w-3/4 rounded bg-zinc-200" />
          <div className="h-2.5 w-1/2 rounded bg-zinc-100" />
        </div>
        <div className="size-7 shrink-0 rounded-md bg-zinc-100" />
      </div>
    ))}
  </output>
);

export default function DocumentLibraryDialog({
  authToken,
  defaultDocumentTitle,
  documents,
  open,
  onDeleteOpenDocument,
  onAuthExpired,
  onOpenChange,
  onOpenDocument,
  onRenameDocument,
}: DocumentLibraryDialogProps) {
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const [actionMenuDocumentId, setActionMenuDocumentId] = useState<
    string | null
  >(null);
  const [deleteDocument, setDeleteDocument] = useState<LibraryDocument | null>(
    null,
  );
  const [editDocument, setEditDocument] = useState<LibraryDocument | null>(
    null,
  );
  const [editTitle, setEditTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [remoteDocuments, setRemoteDocuments] = useState<LibraryDocument[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [showPreviewScrollHint, setShowPreviewScrollHint] = useState(false);
  const [totalRemoteDocuments, setTotalRemoteDocuments] = useState(0);

  const localDocuments = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();

    if (page !== 1) {
      return [];
    }

    return documents
      .filter((documentItem) => !isGuid(documentItem.id))
      .filter((documentItem) =>
        normalizedSearch
          ? documentItem.title.toLowerCase().includes(normalizedSearch)
          : true,
      )
      .map(
        (documentItem): LibraryDocument => ({
          ...documentItem,
          source: "local",
        }),
      );
  }, [documents, page, searchQuery]);

  const libraryDocuments = useMemo(() => {
    const localIds = new Set(
      localDocuments.map((documentItem) => documentItem.id),
    );

    return [
      ...localDocuments,
      ...remoteDocuments.filter(
        (documentItem) => !localIds.has(documentItem.id),
      ),
    ];
  }, [localDocuments, remoteDocuments]);

  const selectedDocument = useMemo(
    () =>
      libraryDocuments.find(
        (documentItem) => documentItem.id === selectedDocumentId,
      ) ?? null,
    [libraryDocuments, selectedDocumentId],
  );
  const hasSelectedDocument = selectedDocument !== null;

  const totalPages = Math.max(1, Math.ceil(totalRemoteDocuments / PAGE_SIZE));
  const hasSelectedDocumentOpen = selectedDocument
    ? documents.some((documentItem) => documentItem.id === selectedDocument.id)
    : false;

  const syncPreviewScrollHint = useCallback(() => {
    const previewScrollElement = previewScrollRef.current;

    if (!previewScrollElement) {
      setShowPreviewScrollHint(false);
      return;
    }

    const hasOverflow =
      previewScrollElement.scrollHeight > previewScrollElement.clientHeight + 8;
    const hasMoreBelow =
      previewScrollElement.scrollTop + previewScrollElement.clientHeight <
      previewScrollElement.scrollHeight - 8;

    setShowPreviewScrollHint(hasOverflow && hasMoreBelow);
  }, []);

  useEffect(() => {
    if (!open || !selectedDocument) {
      setShowPreviewScrollHint(false);
      return;
    }

    const animationFrameId = window.requestAnimationFrame(
      syncPreviewScrollHint,
    );
    window.addEventListener("resize", syncPreviewScrollHint);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", syncPreviewScrollHint);
    };
  }, [open, selectedDocument, syncPreviewScrollHint]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
      setSelectedDocumentId(null);
      setActionMenuDocumentId(null);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, searchInput]);

  useEffect(() => {
    if (!open || !authToken) {
      setRemoteDocuments([]);
      setTotalRemoteDocuments(0);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    void fetchDocumentsWithApi(authToken, {
      page,
      pageSize: PAGE_SIZE,
      search: searchQuery,
      sort: "updatedAt",
    })
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setRemoteDocuments(response.items.map(toLibraryDocument));
        setTotalRemoteDocuments(response.total);
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        if (error instanceof ApiRequestError && error.status === 401) {
          onAuthExpired();
          return;
        }

        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Não foi possível carregar os documentos.";
        toast.error(message);
        setRemoteDocuments([]);
        setTotalRemoteDocuments(0);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [authToken, onAuthExpired, open, page, searchQuery]);

  const handleStartEdit = useCallback((documentItem: LibraryDocument) => {
    setActionMenuDocumentId(null);
    setEditDocument(documentItem);
    setEditTitle(documentItem.title);
  }, []);

  const handleStartDelete = useCallback((documentItem: LibraryDocument) => {
    setActionMenuDocumentId(null);
    setDeleteDocument(documentItem);
  }, []);

  const handleConfirmEdit = useCallback(async () => {
    if (!editDocument) {
      return;
    }

    const nextTitle = editTitle.trim() || defaultDocumentTitle;
    setIsSubmitting(true);

    try {
      let updatedDocument = editDocument;

      if (authToken && isGuid(editDocument.id)) {
        updatedDocument = toLibraryDocument(
          await updateDocumentTitleWithApi(
            authToken,
            editDocument.id,
            nextTitle,
          ),
        );
      } else {
        updatedDocument = {
          ...editDocument,
          title: nextTitle,
          titleMode: "manual",
        };
      }

      setRemoteDocuments((previousDocuments) =>
        previousDocuments.map((documentItem) =>
          documentItem.id === updatedDocument.id
            ? updatedDocument
            : documentItem,
        ),
      );
      onRenameDocument(updatedDocument.id, updatedDocument.title);
      setEditDocument(null);
      toast.success("Título atualizado.");
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        onAuthExpired();
        return;
      }

      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Não foi possível editar o título.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    authToken,
    defaultDocumentTitle,
    editDocument,
    editTitle,
    onRenameDocument,
    onAuthExpired,
  ]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteDocument) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (authToken && isGuid(deleteDocument.id)) {
        await deleteDocumentWithApi(authToken, deleteDocument.id);
      }

      setRemoteDocuments((previousDocuments) =>
        previousDocuments.filter(
          (documentItem) => documentItem.id !== deleteDocument.id,
        ),
      );
      setTotalRemoteDocuments((previousTotal) =>
        isGuid(deleteDocument.id)
          ? Math.max(0, previousTotal - 1)
          : previousTotal,
      );
      onDeleteOpenDocument(deleteDocument.id);

      if (selectedDocumentId === deleteDocument.id) {
        setSelectedDocumentId(null);
      }

      setDeleteDocument(null);
      toast.success("Documento apagado.");
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        onAuthExpired();
        return;
      }

      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Não foi possível apagar o documento.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    authToken,
    deleteDocument,
    onAuthExpired,
    onDeleteOpenDocument,
    selectedDocumentId,
  ]);

  const handleOpenSelectedDocument = useCallback(() => {
    if (!selectedDocument) {
      return;
    }

    if (!hasSelectedDocumentOpen) {
      onOpenDocument(selectedDocument);
    }

    onOpenChange(false);
  }, [hasSelectedDocumentOpen, onOpenChange, onOpenDocument, selectedDocument]);

  const previewText = selectedDocument
    ? getPlainTextPreview(selectedDocument.content)
    : "";
  const previewSrcDoc = selectedDocument
    ? `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font:14px/1.6 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#3f3f46;background:white}*{max-width:100%;box-sizing:border-box}h1,h2,h3,h4{color:#18181b;line-height:1.2}pre{white-space:pre-wrap;background:#f4f4f5;padding:12px;border-radius:6px}blockquote{margin-left:0;padding-left:12px;border-left:3px solid #d4d4d8;color:#52525b}</style></head><body>${selectedDocument.content}</body></html>`
    : "";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={libraryDialogContentClassName}>
          <DialogHeader className="shrink-0 border-b border-zinc-200/80 bg-zinc-50/70 px-4 py-4 sm:px-6">
            <DialogTitle>Ver documentos</DialogTitle>
            <DialogDescription>
              Busque, abra, renomeie ou apague seus documentos.
            </DialogDescription>
          </DialogHeader>

          <div className={libraryDialogBodyClassName}>
            <div
              className={cn(
                libraryListPaneClassName,
                hasSelectedDocument ? "hidden md:flex" : "flex",
              )}
            >
              <div className="shrink-0 border-b border-zinc-200/80 p-3">
                <div className="relative">
                  <Search className="pointer-events-none -translate-y-1/2 absolute top-1/2 left-3 size-4 text-zinc-400" />
                  <Input
                    type="search"
                    enterKeyHint="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Buscar documentos"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className={libraryListClassName}>
                {isLoading ? (
                  <DocumentLibraryListSkeleton />
                ) : libraryDocuments.length === 0 ? (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-zinc-500">
                    Nenhum documento encontrado.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {libraryDocuments.map((documentItem) => {
                      const isSelected = documentItem.id === selectedDocumentId;
                      const isOpen = documents.some(
                        (openDocument) => openDocument.id === documentItem.id,
                      );

                      return (
                        <div key={documentItem.id} className="relative">
                          <button
                            type="button"
                            className={`flex w-full min-w-0 items-center gap-2 rounded-md border px-2 py-2 text-left transition ${
                              isSelected
                                ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                                : "border-transparent hover:bg-zinc-100"
                            }`}
                            onClick={() =>
                              setSelectedDocumentId(documentItem.id)
                            }
                          >
                            <FileText className="size-4 shrink-0 text-emerald-600" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {documentItem.title}
                              </span>
                              <span className="block truncate text-xs text-zinc-500">
                                {isOpen ? "Aberto" : "Fechado"} ·{" "}
                                {documentItem.source === "local"
                                  ? "Local"
                                  : "Salvo"}
                              </span>
                            </span>
                          </button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Ações do documento"
                            className="absolute top-2 right-2 bg-white/80 text-zinc-500 hover:text-zinc-900"
                            onClick={(event) => {
                              event.stopPropagation();
                              setActionMenuDocumentId((currentId) =>
                                currentId === documentItem.id
                                  ? null
                                  : documentItem.id,
                              );
                            }}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>

                          {actionMenuDocumentId === documentItem.id ? (
                            <div className="absolute top-9 right-2 z-10 w-40 rounded-md border border-zinc-200 bg-white p-1 shadow-lg">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => handleStartEdit(documentItem)}
                              >
                                <PencilLine className="size-4" />
                                Editar título
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 text-red-600 hover:text-red-700"
                                onClick={() => handleStartDelete(documentItem)}
                              >
                                <Trash2 className="size-4" />
                                Excluir
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center justify-between border-t border-zinc-200/80 px-3 py-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    setSelectedDocumentId(null);
                    setActionMenuDocumentId(null);
                    setPage((currentPage) => currentPage - 1);
                  }}
                >
                  <ChevronLeft className="size-4" />
                  Anterior
                </Button>
                <span className="text-xs text-zinc-500">
                  Página {page} de {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!authToken || page >= totalPages}
                  onClick={() => {
                    setSelectedDocumentId(null);
                    setActionMenuDocumentId(null);
                    setPage((currentPage) => currentPage + 1);
                  }}
                >
                  Próxima
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div
              className={cn(
                libraryPreviewPaneClassName,
                hasSelectedDocument ? "flex" : "hidden md:flex",
              )}
            >
              {selectedDocument ? (
                <>
                  <div className={libraryMobilePreviewNavClassName}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-fit gap-2 px-0 text-zinc-600 hover:bg-transparent hover:text-zinc-950"
                      onClick={() => {
                        setSelectedDocumentId(null);
                        setActionMenuDocumentId(null);
                      }}
                    >
                      <ChevronLeft className="size-4" />
                      Voltar
                    </Button>
                  </div>

                  <div
                    className={libraryPreviewContentClassName}
                    onScroll={syncPreviewScrollHint}
                    ref={previewScrollRef}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-zinc-950">
                          {selectedDocument.title}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {hasSelectedDocumentOpen
                            ? "Aberto em aba"
                            : "Fechado"}
                        </p>
                      </div>
                      <span className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600">
                        {selectedDocument.source === "local"
                          ? "Local"
                          : "Salvo"}
                      </span>
                    </div>

                    <div className="max-h-[42svh] overflow-y-auto rounded-md border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-700">
                      {hasMeaningfulEditorContent(selectedDocument.content) ? (
                        <iframe
                          title={`Pré-visualização de ${selectedDocument.title}`}
                          sandbox=""
                          srcDoc={previewSrcDoc}
                          className="h-72 w-full border-0 bg-white"
                          onLoad={syncPreviewScrollHint}
                        />
                      ) : (
                        <p className="text-zinc-500">{previewText}</p>
                      )}
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-zinc-400" />
                        Criado em {formatDate(selectedDocument.createdAt)}
                      </div>
                      {selectedDocument.updatedAt ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-zinc-400" />
                          Atualizado em {formatDate(selectedDocument.updatedAt)}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {showPreviewScrollHint ? (
                    <div
                      aria-hidden="true"
                      className={libraryScrollHintClassName}
                    >
                      <ArrowDown className="size-4 animate-bounce" />
                    </div>
                  ) : null}

                  <DialogFooter className="shrink-0 border-t border-zinc-200/80 bg-white px-4 py-4 sm:px-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="button" onClick={handleOpenSelectedDocument}>
                      Abrir documento
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <div className={libraryEmptyPreviewClassName}>
                  Selecione um documento na lista para ver a pré-visualização.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDocument !== null}
        onOpenChange={() => setEditDocument(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar título</DialogTitle>
            <DialogDescription>
              Defina um novo título para o documento.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleConfirmEdit();
              }
            }}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setEditDocument(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleConfirmEdit()}
            >
              Salvar título
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDocument !== null}
        onOpenChange={() => setDeleteDocument(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apagar documento</DialogTitle>
            <DialogDescription>
              Deseja realmente apagar o arquivo?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setDeleteDocument(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={() => void handleConfirmDelete()}
            >
              Apagar arquivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
