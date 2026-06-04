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
  isDefaultDocumentTitle,
} from "../editor-document";

const DOCUMENTS_STORAGE_KEY = "calcify_documents_v1";
const ACTIVE_DOCUMENT_ID_STORAGE_KEY = "calcify_active_document_id_v1";

type StoredDocument = {
  id: string;
  title: string;
  content: string;
  clientDocumentId?: string | null;
  createdAt: string;
  serverUpdatedAt?: string;
  titleMode: "auto" | "manual";
};

const getWelcomeDocumentTemplate = (): Document => ({
  ...createBlankDocument("Marcos Nathanael"),
  content: renderMarkdownToHtml(FIRST_ACCESS_WELCOME_MARKDOWN),
  titleMode: "manual",
});

const isUntouchedWelcomeDocument = (documentItem: Document) => {
  const welcomeTemplate = getWelcomeDocumentTemplate();

  return (
    documentItem.titleMode === "manual" &&
    documentItem.title === welcomeTemplate.title &&
    documentItem.content === welcomeTemplate.content
  );
};

const isTitleMode = (value: unknown): value is "auto" | "manual" =>
  value === "auto" || value === "manual";

const toDocument = (storedDocument: StoredDocument): Document => {
  const createdAtDate = new Date(storedDocument.createdAt);
  const hasMeaningfulContent = hasMeaningfulEditorContent(
    storedDocument.content,
  );
  const titleWasEditedByUser =
    storedDocument.titleMode === "manual" &&
    !isDefaultDocumentTitle(storedDocument.title);
  const contentWasEditedByUser = hasMeaningfulContent;
  const hasUserEdited = titleWasEditedByUser || contentWasEditedByUser;

  return {
    id: storedDocument.id,
    title: storedDocument.title,
    content: storedDocument.content,
    clientDocumentId: storedDocument.clientDocumentId ?? null,
    createdAt: Number.isNaN(createdAtDate.getTime())
      ? new Date()
      : createdAtDate,
    serverUpdatedAt: storedDocument.serverUpdatedAt,
    titleMode: storedDocument.titleMode,
    isPersisted: Boolean(storedDocument.serverUpdatedAt),
    isDirty: false,
    hasUserEdited,
    titleWasEditedByUser,
    contentWasEditedByUser,
  };
};

const parseStoredDocuments = (rawValue: string | null): Document[] => {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter((item): item is StoredDocument => {
        if (!item || typeof item !== "object") {
          return false;
        }

        const candidate = item as Partial<StoredDocument>;
        const hasValidClientDocumentId =
          candidate.clientDocumentId === undefined ||
          candidate.clientDocumentId === null ||
          typeof candidate.clientDocumentId === "string";
        const hasValidServerUpdatedAt =
          candidate.serverUpdatedAt === undefined ||
          typeof candidate.serverUpdatedAt === "string";

        return (
          typeof candidate.id === "string" &&
          typeof candidate.title === "string" &&
          typeof candidate.content === "string" &&
          typeof candidate.createdAt === "string" &&
          hasValidClientDocumentId &&
          hasValidServerUpdatedAt &&
          isTitleMode(candidate.titleMode)
        );
      })
      .map(toDocument);
  } catch {
    return [];
  }
};

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
  const [isStorageHydrated, setIsStorageHydrated] = useState(false);
  const [hadStoredDocuments, setHadStoredDocuments] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const parsedStoredDocuments = parseStoredDocuments(
        localStorage.getItem(DOCUMENTS_STORAGE_KEY),
      );
      const hasSeenWelcome =
        localStorage.getItem(FIRST_ACCESS_WELCOME_KEY) === "1";
      const hasStoredUntouchedWelcome =
        parsedStoredDocuments.length === 1 &&
        isUntouchedWelcomeDocument(parsedStoredDocuments[0]);
      const storedDocuments = hasStoredUntouchedWelcome
        ? []
        : parsedStoredDocuments;

      if (hasStoredUntouchedWelcome && !hasSeenWelcome) {
        localStorage.setItem(FIRST_ACCESS_WELCOME_KEY, "1");
      }

      if (hasStoredUntouchedWelcome) {
        localStorage.removeItem(DOCUMENTS_STORAGE_KEY);
        localStorage.removeItem(ACTIVE_DOCUMENT_ID_STORAGE_KEY);
      }

      if (storedDocuments.length === 0) {
        return;
      }

      setHadStoredDocuments(true);
      setDocuments(storedDocuments);

      const storedActiveDocumentId = localStorage.getItem(
        ACTIVE_DOCUMENT_ID_STORAGE_KEY,
      );

      const hasStoredActiveDocument = storedDocuments.some(
        (documentItem) => documentItem.id === storedActiveDocumentId,
      );

      setActiveDocumentId(
        hasStoredActiveDocument
          ? (storedActiveDocumentId as string)
          : storedDocuments[0].id,
      );
    } catch {
      // Ignora erros de leitura do localStorage para evitar quebrar o uso do editor.
    } finally {
      setIsStorageHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isStorageHydrated || typeof window === "undefined") {
      return;
    }

    try {
      if (
        documents.length === 1 &&
        isUntouchedWelcomeDocument(documents[0]) &&
        localStorage.getItem(FIRST_ACCESS_WELCOME_KEY) === "1"
      ) {
        localStorage.removeItem(DOCUMENTS_STORAGE_KEY);
        localStorage.removeItem(ACTIVE_DOCUMENT_ID_STORAGE_KEY);
        return;
      }

      const serializedDocuments = documents.map((documentItem) => ({
        ...documentItem,
        createdAt: documentItem.createdAt.toISOString(),
      }));

      localStorage.setItem(
        DOCUMENTS_STORAGE_KEY,
        JSON.stringify(serializedDocuments),
      );
      localStorage.setItem(ACTIVE_DOCUMENT_ID_STORAGE_KEY, activeDocumentId);
    } catch {
      // Ignore storage errors to avoid breaking editor usage.
    }
  }, [activeDocumentId, documents, isStorageHydrated]);

  const updateActiveDocumentContent = useCallback(
    (content: string, options?: { isUserEdit?: boolean }) => {
      setDocuments((previousDocuments) =>
        previousDocuments.map((documentItem) => {
          if (documentItem.id !== activeDocumentId) {
            return documentItem;
          }

          if (documentItem.content === content) {
            if (!options?.isUserEdit) {
              return documentItem;
            }

            if (documentItem.hasUserEdited) {
              return documentItem;
            }

            return {
              ...documentItem,
              hasUserEdited: true,
              contentWasEditedByUser: true,
            };
          }

          return {
            ...documentItem,
            content,
            isDirty: true,
            hasUserEdited: documentItem.hasUserEdited || !!options?.isUserEdit,
            contentWasEditedByUser:
              documentItem.contentWasEditedByUser || !!options?.isUserEdit,
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

  const handleCreateDocument = useCallback(
    (initialTitle: string, initialContent?: string) => {
      const newDocument = createBlankDocument(initialTitle, {
        content: initialContent,
        titleWasEditedByUser: Boolean(initialTitle.trim()),
        contentWasEditedByUser: Boolean(
          initialContent && hasMeaningfulEditorContent(initialContent),
        ),
      });

      setDocuments((previousDocuments) => [...previousDocuments, newDocument]);
      setActiveDocumentId(newDocument.id);
      setIsCreateDialogOpen(false);
    },
    [],
  );

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
            if (documentItem.titleWasEditedByUser) {
              return documentItem;
            }

            return {
              ...documentItem,
              hasUserEdited: true,
              titleWasEditedByUser: true,
            };
          }

          return {
            ...documentItem,
            title: normalizedTitle,
            titleMode: "manual",
            isDirty: true,
            hasUserEdited: true,
            titleWasEditedByUser: true,
          };
        }),
      );
    },
    [],
  );

  useEffect(() => {
    if (!isStorageHydrated || typeof window === "undefined") {
      return;
    }

    if (hadStoredDocuments) {
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

      const welcomeDocument = getWelcomeDocumentTemplate();

      setDocuments([welcomeDocument]);
      setActiveDocumentId(welcomeDocument.id);
    } catch {
      // Ignore storage errors and keep editor usage functional.
    }
  }, [documents, hadStoredDocuments, isStorageHydrated]);

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
    hadStoredDocuments,
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
