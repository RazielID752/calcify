"use client";

import { useCallback, useMemo, useState } from "react";
import CreateDocumentDialog from "./document-tabs/create-document-dialog";
import DocumentTabsStrip, {
  type DocumentTabItem,
} from "./document-tabs/document-tabs-strip";
import RenameDocumentDialog from "./document-tabs/rename-document-dialog";

type DocumentTabsBarProps = {
  documents: DocumentTabItem[];
  activeDocumentId: string;
  isCreateDialogOpen: boolean;
  defaultDocumentTitle: string;
  onActiveDocumentChange: (id: string) => void;
  onOpenCreateDialog: () => void;
  onCreateDocument: (title: string) => void;
  onRenameDocument: (id: string, title: string) => void;
  onCreateDialogOpenChange: (open: boolean) => void;
};

export default function DocumentTabsBar({
  documents,
  activeDocumentId,
  isCreateDialogOpen,
  defaultDocumentTitle,
  onActiveDocumentChange,
  onOpenCreateDialog,
  onCreateDocument,
  onRenameDocument,
  onCreateDialogOpenChange,
}: DocumentTabsBarProps) {
  const [renameDocumentId, setRenameDocumentId] = useState<string | null>(null);

  const isRenameDialogOpen = renameDocumentId !== null;

  const renameDocument = useMemo(
    () =>
      documents.find((documentItem) => documentItem.id === renameDocumentId),
    [documents, renameDocumentId],
  );

  const handleRequestRenameDocument = useCallback(
    (documentItem: DocumentTabItem) => {
      setRenameDocumentId(documentItem.id);
    },
    [],
  );

  const handleRenameDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setRenameDocumentId(null);
    }
  }, []);

  const handleRenameDialogConfirm = useCallback(
    (nextTitle: string) => {
      if (!renameDocumentId) {
        return;
      }

      onRenameDocument(renameDocumentId, nextTitle);
      setRenameDocumentId(null);
    },
    [onRenameDocument, renameDocumentId],
  );

  return (
    <>
      <DocumentTabsStrip
        documents={documents}
        activeDocumentId={activeDocumentId}
        onActiveDocumentChange={onActiveDocumentChange}
        onOpenCreateDialog={onOpenCreateDialog}
        onRequestRenameDocument={handleRequestRenameDocument}
      />

      <CreateDocumentDialog
        open={isCreateDialogOpen}
        defaultDocumentTitle={defaultDocumentTitle}
        onOpenChange={onCreateDialogOpenChange}
        onCreateDocument={onCreateDocument}
      />

      <RenameDocumentDialog
        open={isRenameDialogOpen}
        initialTitle={renameDocument?.title ?? ""}
        defaultDocumentTitle={defaultDocumentTitle}
        onOpenChange={handleRenameDialogOpenChange}
        onConfirm={handleRenameDialogConfirm}
      />
    </>
  );
}
