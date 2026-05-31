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
  fetchDocumentWithApi,
  fetchDocumentsWithApi,
  isGuid,
  upsertDocumentWithApi,
} from "@/app/services/document.service";
import type { DocumentApiResponse } from "@/app/interfaces/documents";
import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  clearAuthSession,
  persistAuthSession,
} from "@/utils/auth-session";
import { loginWithApi, logoutWithApi } from "@/utils/auth-api";
import {
  createDocumentId,
  DEFAULT_DOCUMENT_TITLE,
  type Document,
  FIRST_ACCESS_WELCOME_KEY,
} from "../editor-document";

const AUTOSAVE_DEBOUNCE_MS = 1500;
const AUTOSAVE_RETRY_BASE_MS = 2000;
const AUTOSAVE_RETRY_MAX_MS = 30000;
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
  | { status: "notFound"; error: ApiRequestError; localDocumentId?: string }
  | {
      status: "saved";
      savedDocument: Awaited<ReturnType<typeof upsertDocumentWithApi>>;
    }
  | { status: "conflict"; error: ApiRequestError }
  | { status: "error"; error: unknown };

export type UseEditorAccountSyncOptions = {
  documents: Document[];
  setDocuments: Dispatch<SetStateAction<Document[]>>;
  hadStoredDocuments: boolean;
  activeDocumentId: string;
  setActiveDocumentId: (documentId: string) => void;
  closeDocumentLocally: (documentId: string) => void;
  persistCurrentDocumentHtml: () => void;
};

const normalizeDocumentTitle = (title: string) =>
  title.trim() || DEFAULT_DOCUMENT_TITLE;

const getDocumentFingerprint = (
  documentItem: Pick<Document, "content" | "title">,
) =>
  `${normalizeDocumentTitle(documentItem.title)}\n${documentItem.content ?? ""}`;

const getMostRecentApiDocuments = (items: DocumentApiResponse[]) => {
  const latestDocumentByFingerprint = new Map<string, (typeof items)[number]>();

  for (const item of items) {
    const fingerprint = getDocumentFingerprint({
      title: item.title,
      content: item.content,
    });
    const existingItem = latestDocumentByFingerprint.get(fingerprint);

    if (
      !existingItem ||
      new Date(item.updatedAt).getTime() >
        new Date(existingItem.updatedAt).getTime()
    ) {
      latestDocumentByFingerprint.set(fingerprint, item);
    }
  }

  return Array.from(latestDocumentByFingerprint.values());
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

    for (const documentItem of documents) {
      if (isGuid(documentItem.id) && documentItem.serverUpdatedAt) {
        serverUpdatedAtByDocumentIdRef.current[documentItem.id] =
          documentItem.serverUpdatedAt;
      }
    }
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

  const detachServerDocumentToLocal = useCallback(
    (documentId: string) => {
      if (!isGuid(documentId)) {
        return undefined;
      }

      const localDocumentId = createDocumentId();
      let didDetachDocument = false;

      const nextDocuments = documentsRef.current.map((documentItem) => {
        if (documentItem.id !== documentId) {
          return documentItem;
        }

        didDetachDocument = true;

        return {
          ...documentItem,
          id: localDocumentId,
          clientDocumentId: documentItem.clientDocumentId ?? localDocumentId,
          serverUpdatedAt: undefined,
        };
      });

      if (!didDetachDocument) {
        return undefined;
      }

      documentsRef.current = nextDocuments;
      setDocuments(nextDocuments);
      delete serverUpdatedAtByDocumentIdRef.current[documentId];

      if (activeDocumentIdRef.current === documentId) {
        activeDocumentIdRef.current = localDocumentId;
        setActiveDocumentId(localDocumentId);
      }

      return localDocumentId;
    },
    [setActiveDocumentId, setDocuments],
  );

  const detachAllServerDocumentsToLocal = useCallback(() => {
    const replacementIdByDocumentId = new Map<string, string>();
    let didDetachDocument = false;

    const nextDocuments = documentsRef.current.map((documentItem) => {
      if (!isGuid(documentItem.id)) {
        return documentItem;
      }

      didDetachDocument = true;
      const localDocumentId =
        replacementIdByDocumentId.get(documentItem.id) ?? createDocumentId();
      replacementIdByDocumentId.set(documentItem.id, localDocumentId);

      return {
        ...documentItem,
        id: localDocumentId,
        clientDocumentId: documentItem.clientDocumentId ?? localDocumentId,
        serverUpdatedAt: undefined,
      };
    });

    if (!didDetachDocument) {
      return;
    }

    documentsRef.current = nextDocuments;
    setDocuments(nextDocuments);
    serverUpdatedAtByDocumentIdRef.current = {};

    const activeReplacementId = replacementIdByDocumentId.get(
      activeDocumentIdRef.current,
    );

    if (activeReplacementId) {
      activeDocumentIdRef.current = activeReplacementId;
      setActiveDocumentId(activeReplacementId);
    }
  }, [setActiveDocumentId, setDocuments]);

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
        let knownUpdatedAt =
          serverUpdatedAtByDocumentIdRef.current[currentDocument.id] ??
          currentDocument.serverUpdatedAt;

        if (isGuid(currentDocument.id) && !knownUpdatedAt) {
          const serverDocument = await fetchDocumentWithApi(
            token,
            currentDocument.id,
          );
          knownUpdatedAt = serverDocument.updatedAt;
          serverUpdatedAtByDocumentIdRef.current[currentDocument.id] =
            serverDocument.updatedAt;

          setDocuments((previousDocuments) =>
            previousDocuments.map((documentItem) =>
              documentItem.id === currentDocument.id
                ? {
                    ...documentItem,
                    clientDocumentId: serverDocument.clientDocumentId ?? null,
                    serverUpdatedAt: serverDocument.updatedAt,
                  }
                : documentItem,
            ),
          );
        }

        const savedDocument = await upsertDocumentWithApi(
          token,
          currentDocument.id,
          {
            title: normalizeDocumentTitle(currentDocument.title),
            content: currentDocument.content ?? "",
            clientDocumentId:
              currentDocument.clientDocumentId ??
              (!isGuid(currentDocument.id) ? currentDocument.id : undefined),
            isDraft: options?.isDraft ?? false,
          },
          {
            knownUpdatedAt,
          },
        );

        setDocuments((previousDocuments) => {
          const submittedDocumentFingerprint = getDocumentFingerprint({
            title: currentDocument.title,
            content: currentDocument.content,
          });
          const savedDocumentFingerprint = getDocumentFingerprint({
            title: savedDocument.title,
            content: savedDocument.content,
          });
          let didApplySavedDocument = false;

          return previousDocuments
            .map((documentItem) => {
              if (documentItem.id === savedDocument.id) {
                if (didApplySavedDocument) {
                  return null;
                }

                didApplySavedDocument = true;

                const hasNewerLocalChanges =
                  getDocumentFingerprint(documentItem) !==
                  submittedDocumentFingerprint;

                return {
                  ...documentItem,
                  clientDocumentId: savedDocument.clientDocumentId ?? null,
                  title: hasNewerLocalChanges
                    ? documentItem.title
                    : normalizeDocumentTitle(savedDocument.title),
                  content: hasNewerLocalChanges
                    ? documentItem.content
                    : (savedDocument.content ?? ""),
                  serverUpdatedAt: savedDocument.updatedAt,
                  titleMode: "manual" as const,
                };
              }

              if (documentItem.id !== currentDocument.id) {
                return documentItem;
              }

              if (didApplySavedDocument) {
                return null;
              }

              didApplySavedDocument = true;

              const hasNewerLocalChanges =
                getDocumentFingerprint(documentItem) !==
                submittedDocumentFingerprint;

              return {
                ...documentItem,
                id: savedDocument.id,
                clientDocumentId: savedDocument.clientDocumentId ?? null,
                title: hasNewerLocalChanges
                  ? documentItem.title
                  : normalizeDocumentTitle(savedDocument.title),
                content: hasNewerLocalChanges
                  ? documentItem.content
                  : (savedDocument.content ?? ""),
                serverUpdatedAt: savedDocument.updatedAt,
                titleMode: "manual" as const,
              };
            })
            .filter((documentItem): documentItem is Document => {
              if (!documentItem) {
                return false;
              }

              if (
                documentItem.id !== savedDocument.id &&
                !isGuid(documentItem.id) &&
                getDocumentFingerprint(documentItem) ===
                  savedDocumentFingerprint
              ) {
                return false;
              }

              return true;
            });
        });

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
        if (error instanceof ApiRequestError && error.status === 404) {
          return {
            status: "notFound",
            error,
            localDocumentId: detachServerDocumentToLocal(documentId),
          };
        }

        if (error instanceof ApiRequestError && error.status === 409) {
          return { status: "conflict", error };
        }

        return { status: "error", error };
      }
    },
    [
      clearAutosaveRetryTimer,
      detachServerDocumentToLocal,
      setActiveDocumentId,
      setDocuments,
    ],
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

        if (result.status === "notFound") {
          clearAutosaveRetryTimer();
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

    void fetchDocumentsWithApi(authToken, {
      page: 1,
      pageSize: 1,
      sort: "updatedAt",
    })
      .then(({ items, total }) => {
        if (isCancelled) {
          return;
        }

        if (total === 0) {
          serverUpdatedAtByDocumentIdRef.current = {};

          if (hadStoredDocuments) {
            detachAllServerDocumentsToLocal();
          }

          return;
        }

        if (items.length === 0) {
          return;
        }

        const latestApiItems = getMostRecentApiDocuments(items);
        const apiDocuments = latestApiItems.map((item) => ({
          id: item.id,
          clientDocumentId: item.clientDocumentId ?? null,
          title: normalizeDocumentTitle(item.title),
          content: item.content ?? "",
          createdAt: new Date(item.createdAt),
          serverUpdatedAt: item.updatedAt,
          titleMode: "manual" as const,
        }));

        serverUpdatedAtByDocumentIdRef.current = Object.fromEntries(
          latestApiItems.map((item) => [item.id, item.updatedAt]),
        );

        if (!hadStoredDocuments) {
          setDocuments(apiDocuments);
          setActiveDocumentId(apiDocuments[0].id);
          return;
        }

        setDocuments((previousDocuments) => {
          const existingLocalDocumentByFingerprint = new Map<
            string,
            Document
          >();

          for (const documentItem of previousDocuments) {
            if (isGuid(documentItem.id)) {
              continue;
            }

            existingLocalDocumentByFingerprint.set(
              getDocumentFingerprint(documentItem),
              documentItem,
            );
          }

          const localIdReplacementById = new Map<string, string>();

          for (const documentItem of apiDocuments) {
            if (
              previousDocuments.some(
                (previousDocument) => previousDocument.id === documentItem.id,
              )
            ) {
              continue;
            }

            const matchingLocalDocument =
              existingLocalDocumentByFingerprint.get(
                getDocumentFingerprint(documentItem),
              );

            if (!matchingLocalDocument) {
              continue;
            }

            localIdReplacementById.set(
              matchingLocalDocument.id,
              documentItem.id,
            );
          }

          const mergedDocuments = previousDocuments
            .map((documentItem) => {
              const replacementId = localIdReplacementById.get(documentItem.id);

              if (!replacementId) {
                return documentItem;
              }

              const apiDocument = apiDocuments.find(
                (item) => item.id === replacementId,
              );

              if (!apiDocument) {
                return documentItem;
              }

              return apiDocument;
            })
            .filter(
              (documentItem, documentIndex, mergedItems) =>
                mergedItems.findIndex((item) => item.id === documentItem.id) ===
                documentIndex,
            );

          const activeReplacementId = localIdReplacementById.get(
            activeDocumentIdRef.current,
          );

          if (activeReplacementId) {
            setActiveDocumentId(activeReplacementId);
          }

          return mergedDocuments;
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
    detachAllServerDocumentsToLocal,
    hadStoredDocuments,
    setActiveDocumentId,
    setDocuments,
  ]);

  useEffect(() => {
    const flushExistingServerDocument = () => {
      if (!isGuid(activeDocumentIdRef.current)) {
        return;
      }

      flushAutosave();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistCurrentDocumentHtml();
        flushExistingServerDocument();
      }
    };

    const handleBeforeUnload = () => {
      persistCurrentDocumentHtml();
      flushExistingServerDocument();
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

      if (result.status === "notFound") {
        const message = result.localDocumentId
          ? "Documento não existe mais no servidor. Mantive uma cópia local; salve novamente para criar um novo arquivo."
          : "Documento não encontrado no servidor. Abra a versão salva pela biblioteca de documentos.";
        toast.error(message, { id: savingToastId });
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
        persistAuthSession(response);
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
      clearAuthSession();
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
