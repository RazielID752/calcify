import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  ApiRequestError,
  deleteDocumentWithApi,
  fetchDocumentsWithApi,
  isGuid,
  loginWithApi,
  logoutWithApi,
  upsertDocumentWithApi,
} from "@/utils/auth-api";
import {
  DEFAULT_DOCUMENT_TITLE,
  type Document,
  FIRST_ACCESS_WELCOME_KEY,
} from "../editor-document";

const AUTOSAVE_DEBOUNCE_MS = 1500;
const AUTOSAVE_RETRY_BASE_MS = 2000;
const AUTOSAVE_RETRY_MAX_MS = 30000;
const AUTH_TOKEN_STORAGE_KEY = "calcify_auth_token_v1";
const AUTH_USER_STORAGE_KEY = "calcify_auth_user_v1";
const DOCUMENTS_STORAGE_KEY = "calcify_documents_v1";
const ACTIVE_DOCUMENT_ID_STORAGE_KEY = "calcify_active_document_id_v1";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  lastLoginAt: string | null;
};

type SyncResult =
  | { status: "skipped" }
  | { status: "missing" }
  | {
      status: "saved";
      savedDocument: Awaited<ReturnType<typeof upsertDocumentWithApi>>;
    }
  | { status: "conflict"; error: ApiRequestError }
  | { status: "error"; error: unknown };

type UseEditorAccountSyncOptions = {
  documents: Document[];
  setDocuments: Dispatch<SetStateAction<Document[]>>;
  hadStoredDocuments: boolean;
  activeDocumentId: string;
  setActiveDocumentId: (documentId: string) => void;
  closeDocumentLocally: (documentId: string) => void;
  persistCurrentDocumentHtml: () => void;
};

export const useEditorAccountSync = ({
  documents,
  setDocuments,
  hadStoredDocuments,
  activeDocumentId,
  setActiveDocumentId,
  closeDocumentLocally,
  persistCurrentDocumentHtml,
}: UseEditorAccountSyncOptions) => {
  const isSavingDocumentRef = useRef(false);
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveRetryTimerRef = useRef<number | null>(null);
  const autosaveRetryAttemptRef = useRef(0);
  const isAutosaveInFlightRef = useRef(false);
  const isAutosaveQueuedRef = useRef(false);
  const documentsRef = useRef(documents);
  const activeDocumentIdRef = useRef(activeDocumentId);
  const authTokenRef = useRef<string | null>(null);
  const authenticatedUserRef = useRef<AuthUser | null>(null);
  const serverUpdatedAtByDocumentIdRef = useRef<Record<string, string>>({});

  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isLogoutSubmitting, setIsLogoutSubmitting] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(
    null,
  );

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  useEffect(() => {
    activeDocumentIdRef.current = activeDocumentId;
  }, [activeDocumentId]);

  useEffect(() => {
    authTokenRef.current = authToken;
  }, [authToken]);

  useEffect(() => {
    authenticatedUserRef.current = authenticatedUser;
  }, [authenticatedUser]);

  const clearAutosaveTimer = useCallback(() => {
    if (!autosaveTimerRef.current) {
      return;
    }

    window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = null;
  }, []);

  const clearAutosaveRetryTimer = useCallback(() => {
    if (!autosaveRetryTimerRef.current) {
      return;
    }

    window.clearTimeout(autosaveRetryTimerRef.current);
    autosaveRetryTimerRef.current = null;
  }, []);

  const syncDocumentWithApi = useCallback(
    async (
      documentId: string,
      options?: { isDraft?: boolean },
    ): Promise<SyncResult> => {
      const token = authTokenRef.current;
      const currentUser = authenticatedUserRef.current;

      if (!token || !currentUser) {
        return { status: "skipped" };
      }

      const currentDocument = documentsRef.current.find(
        (documentItem) => documentItem.id === documentId,
      );

      if (!currentDocument) {
        return { status: "missing" };
      }

      try {
        const savedDocument = await upsertDocumentWithApi(
          token,
          currentDocument.id,
          {
            title: currentDocument.title?.trim() || DEFAULT_DOCUMENT_TITLE,
            content: currentDocument.content ?? "",
            isDraft: options?.isDraft ?? false,
          },
          {
            knownUpdatedAt:
              serverUpdatedAtByDocumentIdRef.current[currentDocument.id],
          },
        );

        setDocuments((previousDocuments) =>
          previousDocuments.map((documentItem) => {
            if (documentItem.id !== currentDocument.id) {
              return documentItem;
            }

            return {
              ...documentItem,
              id: savedDocument.id,
              title: savedDocument.title?.trim() || DEFAULT_DOCUMENT_TITLE,
              content: savedDocument.content ?? "",
            };
          }),
        );

        if (savedDocument.id !== currentDocument.id) {
          if (activeDocumentIdRef.current === currentDocument.id) {
            setActiveDocumentId(savedDocument.id);
          }

          delete serverUpdatedAtByDocumentIdRef.current[currentDocument.id];
        }

        serverUpdatedAtByDocumentIdRef.current[savedDocument.id] =
          savedDocument.updatedAt;
        autosaveRetryAttemptRef.current = 0;
        clearAutosaveRetryTimer();

        return { status: "saved", savedDocument };
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 409) {
          return { status: "conflict", error };
        }

        return { status: "error", error };
      }
    },
    [clearAutosaveRetryTimer, setActiveDocumentId, setDocuments],
  );

  const runAutosaveNow = useCallback(
    async (documentId?: string) => {
      const token = authTokenRef.current;
      const currentUser = authenticatedUserRef.current;

      if (!token || !currentUser) {
        return;
      }

      const targetDocumentId = documentId ?? activeDocumentIdRef.current;

      if (!targetDocumentId) {
        return;
      }

      if (isAutosaveInFlightRef.current) {
        isAutosaveQueuedRef.current = true;
        return;
      }

      isAutosaveInFlightRef.current = true;
      isAutosaveQueuedRef.current = false;

      try {
        const result = await syncDocumentWithApi(targetDocumentId, {
          isDraft: true,
        });

        if (result.status === "error") {
          const nextAttempt = autosaveRetryAttemptRef.current + 1;
          autosaveRetryAttemptRef.current = nextAttempt;
          const retryDelayMs = Math.min(
            AUTOSAVE_RETRY_MAX_MS,
            AUTOSAVE_RETRY_BASE_MS * 2 ** (nextAttempt - 1),
          );

          clearAutosaveRetryTimer();
          autosaveRetryTimerRef.current = window.setTimeout(() => {
            autosaveRetryTimerRef.current = null;
            void runAutosaveNow(targetDocumentId);
          }, retryDelayMs);
        }

        if (result.status === "conflict") {
          toast.error(
            "Conflito de versão detectado. Recarregue para sincronizar a versão mais recente.",
          );
        }
      } finally {
        isAutosaveInFlightRef.current = false;

        if (isAutosaveQueuedRef.current) {
          isAutosaveQueuedRef.current = false;
          void runAutosaveNow(activeDocumentIdRef.current);
        }
      }
    },
    [clearAutosaveRetryTimer, syncDocumentWithApi],
  );

  const scheduleAutosave = useCallback(() => {
    if (!authTokenRef.current || !authenticatedUserRef.current) {
      return;
    }

    clearAutosaveTimer();
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      void runAutosaveNow();
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [clearAutosaveTimer, runAutosaveNow]);

  const flushAutosave = useCallback(
    (documentId?: string) => {
      clearAutosaveTimer();
      void runAutosaveNow(documentId);
    },
    [clearAutosaveTimer, runAutosaveNow],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      const rawUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);

      if (storedToken && storedToken.trim().length > 0) {
        setAuthToken(storedToken);
      }

      if (!rawUser) {
        return;
      }

      const parsedUser = JSON.parse(rawUser) as Partial<AuthUser>;

      if (
        typeof parsedUser.name === "string" &&
        typeof parsedUser.email === "string"
      ) {
        setAuthenticatedUser({
          id:
            typeof parsedUser.id === "string" && parsedUser.id.trim().length > 0
              ? parsedUser.id
              : "",
          name: parsedUser.name,
          email: parsedUser.email,
          lastLoginAt:
            typeof parsedUser.lastLoginAt === "string"
              ? parsedUser.lastLoginAt
              : null,
        });
      }
    } catch {
      // Ignore parsing/storage errors.
    }
  }, []);

  useEffect(() => {
    if (!authToken || !authenticatedUser) {
      return;
    }

    let isCancelled = false;

    void fetchDocumentsWithApi(authToken)
      .then((items) => {
        if (isCancelled || items.length === 0) {
          return;
        }

        const apiDocuments = items.map((item) => ({
          id: item.id,
          title: item.title?.trim() || DEFAULT_DOCUMENT_TITLE,
          content: item.content ?? "",
          createdAt: new Date(item.createdAt),
          titleMode: "manual" as const,
        }));

        serverUpdatedAtByDocumentIdRef.current = Object.fromEntries(
          items.map((item) => [item.id, item.updatedAt]),
        );

        if (!hadStoredDocuments) {
          setDocuments(apiDocuments);
          setActiveDocumentId(apiDocuments[0].id);
          return;
        }

        setDocuments((previousDocuments) => {
          const existingIds = new Set(
            previousDocuments.map((documentItem) => documentItem.id),
          );
          const missingApiDocuments = apiDocuments.filter(
            (documentItem) => !existingIds.has(documentItem.id),
          );

          if (missingApiDocuments.length === 0) {
            return previousDocuments;
          }

          return [...previousDocuments, ...missingApiDocuments];
        });
      })
      .catch(() => {
        return;
      });

    return () => {
      isCancelled = true;
    };
  }, [
    authToken,
    authenticatedUser,
    hadStoredDocuments,
    setActiveDocumentId,
    setDocuments,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistCurrentDocumentHtml();
        flushAutosave();
      }
    };

    const handleBeforeUnload = () => {
      persistCurrentDocumentHtml();
      flushAutosave();
    };

    const handleOnline = () => {
      if (autosaveRetryTimerRef.current) {
        clearAutosaveRetryTimer();
      }

      flushAutosave();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("online", handleOnline);
    };
  }, [clearAutosaveRetryTimer, flushAutosave, persistCurrentDocumentHtml]);

  useEffect(() => {
    return () => {
      clearAutosaveTimer();
      clearAutosaveRetryTimer();
    };
  }, [clearAutosaveRetryTimer, clearAutosaveTimer]);

  const handleSaveDocument = useCallback(async () => {
    if (isSavingDocumentRef.current) {
      return;
    }

    clearAutosaveTimer();
    clearAutosaveRetryTimer();
    isSavingDocumentRef.current = true;
    const savingToastId = toast.loading("Salvando documento...");
    try {
      persistCurrentDocumentHtml();

      if (!authToken || !authenticatedUser) {
        toast.success("Documento salvo.", { id: savingToastId });
        return;
      }

      const result = await syncDocumentWithApi(activeDocumentId, {
        isDraft: false,
      });

      if (result.status === "saved") {
        toast.success("Documento salvo.", { id: savingToastId });
        return;
      }

      if (result.status === "conflict") {
        toast.error(
          "Conflito de versão detectado. Recarregue para sincronizar a versão mais recente.",
          {
            id: savingToastId,
          },
        );
        return;
      }

      if (result.status === "missing") {
        toast.error("Não foi possível localizar o documento ativo.", {
          id: savingToastId,
        });
        return;
      }

      toast.warning("API indisponível. Salvando apenas localmente.", {
        id: savingToastId,
      });
    } finally {
      isSavingDocumentRef.current = false;
    }
  }, [
    activeDocumentId,
    authToken,
    authenticatedUser,
    clearAutosaveRetryTimer,
    clearAutosaveTimer,
    persistCurrentDocumentHtml,
    syncDocumentWithApi,
  ]);

  const handleLogin = useCallback(() => {
    setLoginErrorMessage("");
    setIsLoginDialogOpen(true);
  }, []);

  const handleContinueLogin = useCallback(
    async (credentials: { login: string; password: string }) => {
      setIsLoginSubmitting(true);
      setLoginErrorMessage("");

      try {
        const response = await loginWithApi(credentials);
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, response.token);
        localStorage.setItem(
          AUTH_USER_STORAGE_KEY,
          JSON.stringify(response.user),
        );
        setAuthToken(response.token);
        setAuthenticatedUser(response.user);
        setIsLoginDialogOpen(false);
      } catch (error) {
        const fallbackMessage = "Não foi possível realizar o login.";
        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : fallbackMessage;
        setLoginErrorMessage(message);
      } finally {
        setIsLoginSubmitting(false);
      }
    },
    [],
  );

  const handleLogoutRequest = useCallback(() => {
    setIsLogoutDialogOpen(true);
  }, []);

  const handleConfirmLogout = useCallback(async () => {
    setIsLogoutSubmitting(true);

    try {
      const currentToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

      if (currentToken) {
        await logoutWithApi(currentToken).catch(() => {
          return;
        });
      }
    } finally {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      localStorage.removeItem(DOCUMENTS_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_DOCUMENT_ID_STORAGE_KEY);
      localStorage.setItem(FIRST_ACCESS_WELCOME_KEY, "1");
      setAuthToken(null);
      setAuthenticatedUser(null);
      setIsLogoutSubmitting(false);
      window.location.reload();
    }
  }, []);

  const handleCloseDocument = useCallback(
    async (documentId: string) => {
      if (!authToken || !authenticatedUser || !isGuid(documentId)) {
        delete serverUpdatedAtByDocumentIdRef.current[documentId];
        closeDocumentLocally(documentId);
        return;
      }

      const deletingToastId = toast.loading("Excluindo documento...");

      try {
        await deleteDocumentWithApi(authToken, documentId);
        delete serverUpdatedAtByDocumentIdRef.current[documentId];
        closeDocumentLocally(documentId);
        toast.success("Documento excluído.", { id: deletingToastId });
      } catch (error) {
        const fallbackMessage = "Não foi possível excluir o documento.";
        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : fallbackMessage;
        toast.error(message, { id: deletingToastId });
      }
    },
    [authToken, authenticatedUser, closeDocumentLocally],
  );

  return {
    authenticatedUser,
    authToken,
    flushAutosave,
    handleCloseDocument,
    handleConfirmLogout,
    handleContinueLogin,
    handleLogin,
    handleLogoutRequest,
    handleSaveDocument,
    isLoginDialogOpen,
    isLoginSubmitting,
    isLogoutDialogOpen,
    isLogoutSubmitting,
    loginErrorMessage,
    scheduleAutosave,
    setIsLoginDialogOpen,
    setIsLogoutDialogOpen,
    setLoginErrorMessage,
  };
};
