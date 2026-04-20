import { useCallback, useEffect, useRef, useState } from "react";
import { renderMarkdownToHtml } from "@/utils/render-markdown";
import {
  createBlankDocument,
  DEFAULT_DOCUMENT_TITLE,
  type Document,
  FIRST_ACCESS_WELCOME_KEY,
  FIRST_ACCESS_WELCOME_MARKDOWN,
  getAutoTitleFromContent,
  hasMeaningfulEditorContent,
  INITIAL_DOCUMENT_ID,
} from "../editor-document";

export const useEditorDocuments = () => {
  const initialDocumentRef = useRef<Document>(
    createBlankDocument("", { fixedId: INITIAL_DOCUMENT_ID }),
  );
  const [documents, setDocuments] = useState<Document[]>(() => [
    initialDocumentRef.current,
  ]);
  const [activeDocumentId, setActiveDocumentId] = useState<string>(
    initialDocumentRef.current.id,
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const updateActiveDocumentContent = useCallback(
    (content: string) => {
      setDocuments((previousDocuments) =>
        previousDocuments.map((documentItem) => {
          if (documentItem.id !== activeDocumentId) {
            return documentItem;
          }

          if (documentItem.content === content) {
            return documentItem;
          }

          return {
            ...documentItem,
            content,
            title:
              documentItem.titleMode === "manual"
                ? documentItem.title
                : getAutoTitleFromContent(content),
          };
        }),
      );
    },
    [activeDocumentId],
  );

  const handleOpenCreateDocumentDialog = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  const handleCreateDocument = useCallback((initialTitle: string) => {
    const newDocument = createBlankDocument(initialTitle);

    setDocuments((previousDocuments) => [...previousDocuments, newDocument]);
    setActiveDocumentId(newDocument.id);
    setIsCreateDialogOpen(false);
  }, []);

  const handleCloseDocument = useCallback(
    (documentId: string) => {
      let nextActiveDocumentId: string | null = null;

      setDocuments((previousDocuments) => {
        const targetDocumentIndex = previousDocuments.findIndex(
          (documentItem) => documentItem.id === documentId,
        );

        if (targetDocumentIndex === -1) {
          return previousDocuments;
        }

        const nextDocuments = previousDocuments.filter(
          (documentItem) => documentItem.id !== documentId,
        );

        if (activeDocumentId === documentId) {
          const fallbackIndex =
            targetDocumentIndex > 0 ? targetDocumentIndex - 1 : 0;
          nextActiveDocumentId = nextDocuments[fallbackIndex]?.id ?? null;
        }

        return nextDocuments;
      });

      if (nextActiveDocumentId) {
        setActiveDocumentId(nextActiveDocumentId);
      }
    },
    [activeDocumentId],
  );

  const handleRenameDocument = useCallback(
    (documentId: string, nextTitle: string) => {
      const normalizedTitle = nextTitle.trim() || DEFAULT_DOCUMENT_TITLE;

      setDocuments((previousDocuments) =>
        previousDocuments.map((documentItem) => {
          if (documentItem.id !== documentId) {
            return documentItem;
          }

          if (documentItem.title === normalizedTitle) {
            return documentItem;
          }

          return {
            ...documentItem,
            title: normalizedTitle,
            titleMode: "manual",
          };
        }),
      );
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const hasSeenWelcome =
        localStorage.getItem(FIRST_ACCESS_WELCOME_KEY) === "1";

      if (hasSeenWelcome) {
        return;
      }

      if (documents.length !== 1) {
        return;
      }

      const firstDocument = documents[0];
      const hasExistingContent = hasMeaningfulEditorContent(
        firstDocument.content,
      );

      localStorage.setItem(FIRST_ACCESS_WELCOME_KEY, "1");

      if (hasExistingContent) {
        return;
      }

      const welcomeHtml = renderMarkdownToHtml(FIRST_ACCESS_WELCOME_MARKDOWN);

      const welcomeDocument: Document = {
        ...createBlankDocument("Marcos Nathanael"),
        content: welcomeHtml,
        titleMode: "manual",
      };

      setDocuments([welcomeDocument]);
      setActiveDocumentId(welcomeDocument.id);
    } catch {
      // Ignore storage errors and keep editor usage functional.
    }
  }, [documents]);

  useEffect(() => {
    if (documents.length === 0) {
      const fallbackDocument = createBlankDocument();
      setDocuments([fallbackDocument]);
      setActiveDocumentId(fallbackDocument.id);
      return;
    }

    const activeDocumentExists = documents.some(
      (documentItem) => documentItem.id === activeDocumentId,
    );

    if (!activeDocumentExists) {
      setActiveDocumentId(documents[0].id);
    }
  }, [activeDocumentId, documents]);

  return {
    documents,
    setDocuments,
    activeDocumentId,
    setActiveDocumentId,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    handleOpenCreateDocumentDialog,
    handleCreateDocument,
    handleCloseDocument,
    handleRenameDocument,
    updateActiveDocumentContent,
  };
};
