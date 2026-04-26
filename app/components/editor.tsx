"use client";

import { GripVertical } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  deleteDocumentWithApi,
  fetchDocumentsWithApi,
  isGuid,
  loginWithApi,
  logoutWithApi,
  upsertDocumentWithApi,
} from "@/utils/auth-api";
import { renderMarkdownToHtml } from "@/utils/render-markdown";
import DocumentTabsBar from "./document-tabs-bar";
import {
  type AlignType,
  editorCommands,
  type HeadingLevel,
  type ListType,
  mathOptions,
} from "./editor-commands";
import { EDITOR_CONTENT_CLASSNAME } from "./editor-content-classname";
import {
  BODY_PLACEHOLDER,
  DEFAULT_DOCUMENT_TITLE,
  EMPTY_EDITOR_HTML,
  FIRST_ACCESS_WELCOME_KEY,
  HELP_DIALOG_STORAGE_KEY,
  hasMeaningfulEditorContent,
  TITLE_PLACEHOLDER,
} from "./editor-document";
import EditorHelpDialog from "./editor-help-dialog";
import EditorImportDialog from "./editor-import-dialog";
import EditorLoginDialog from "./editor-login-dialog";
import EditorLogoutDialog from "./editor-logout-dialog";
import EditorQuickMenu from "./editor-quick-menu";
import EditorToolbar from "./editor-toolbar";
import { useAutoTransforms } from "./hooks/use-auto-transforms";
import { useBlockDragAndDrop } from "./hooks/use-block-drag-and-drop";
import { useEditorContentHandlers } from "./hooks/use-editor-content-handlers";
import { useEditorDialogs } from "./hooks/use-editor-dialogs";
import { useEditorDocuments } from "./hooks/use-editor-documents";
import { useEditorSession } from "./hooks/use-editor-session";
import { useEditorToolbarState } from "./hooks/use-editor-toolbar-state";
import { useMarkdownRenderer } from "./hooks/use-markdown-renderer";
import ImageDialog from "./image-dialog";
import LinkDialog from "./link-dialog";
import ZoomControls from "./zoom-controls";

export default function Editor() {
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

  const {
    documents,
    setDocuments,
    hadStoredDocuments,
    activeDocumentId,
    setActiveDocumentId,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    handleOpenCreateDocumentDialog,
    handleCreateDocument,
    handleCloseDocument: handleCloseDocumentLocal,
    handleRenameDocument,
    updateActiveDocumentContent,
  } = useEditorDocuments();
  const previousActiveDocumentIdRef = useRef<string>(activeDocumentId);
  const isSavingDocumentRef = useRef(false);

  const {
    editorRef,
    getCommandContext,
    updateSavedRange,
    persistHtml,
    applyExternalHtml,
    moveCursorToEnd,
    savedRangeRef,
  } = useEditorSession({
    storageKey: null,
    initialHtml: "",
  });

  const [zoom, setZoom] = useState(100);
  const [isTitleEmpty, setIsTitleEmpty] = useState(true);
  const [isBodyEmpty, setIsBodyEmpty] = useState(true);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isLogoutSubmitting, setIsLogoutSubmitting] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(
    null,
  );
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return localStorage.getItem(HELP_DIALOG_STORAGE_KEY) !== "1";
    } catch {
      return false;
    }
  });

  const ensureEditorScaffoldWhenEmpty = useCallback(
    (options?: { moveCaretTo?: "title" | "body" }) => {
      const editor = editorRef.current;

      if (!editor) {
        return false;
      }

      const html = editor.innerHTML;
      const isEmpty = !hasMeaningfulEditorContent(html);

      if (!isEmpty) {
        return false;
      }

      const firstElement = editor.firstElementChild;
      const firstElementIsTitle =
        firstElement instanceof HTMLHeadingElement &&
        firstElement.tagName === "H1";
      const secondElement = editor.children[1];
      const secondElementIsBody =
        secondElement instanceof HTMLElement &&
        ["P", "DIV"].includes(secondElement.tagName);

      if (!firstElementIsTitle || !secondElementIsBody) {
        editor.innerHTML = EMPTY_EDITOR_HTML;
      }

      const titleElement = editor.querySelector("h1");
      const bodyElement = editor.querySelector("p,div");

      if (
        options?.moveCaretTo === "title" &&
        titleElement instanceof HTMLElement
      ) {
        moveCursorToEnd(titleElement);
      }

      if (
        options?.moveCaretTo === "body" &&
        bodyElement instanceof HTMLElement
      ) {
        moveCursorToEnd(bodyElement);
      }

      return true;
    },
    [editorRef, moveCursorToEnd],
  );

  const ensureTitleBlockWhenEditorIsEmpty = useCallback(
    (options?: { moveCaretTo?: "title" | "body" }) => {
      return ensureEditorScaffoldWhenEmpty(options);
    },
    [ensureEditorScaffoldWhenEmpty],
  );

  const syncEditorEmptyState = useCallback(() => {
    const editor = editorRef.current;
    const rootChildren = editor
      ? (Array.from(editor.children) as HTMLElement[])
      : [];
    const firstChild = rootChildren[0] ?? null;
    const titleElement =
      firstChild instanceof HTMLElement && firstChild.tagName === "H1"
        ? firstChild
        : null;
    const bodyElement = titleElement
      ? (rootChildren[1] ?? null)
      : (firstChild ?? null);

    const titleText =
      titleElement?.textContent?.replaceAll("\u00A0", " ").trim() ?? "";
    const bodyText =
      bodyElement?.textContent?.replaceAll("\u00A0", " ").trim() ?? "";
    const bodyHasMeaningfulContent = bodyElement
      ? hasMeaningfulEditorContent(bodyElement.innerHTML)
      : false;

    const selection = window.getSelection();
    const hasCaretInBody = Boolean(
      selection &&
        selection.rangeCount > 0 &&
        bodyElement &&
        (bodyElement.contains(selection.anchorNode) ||
          bodyElement === selection.anchorNode ||
          bodyElement.contains(selection.focusNode) ||
          bodyElement === selection.focusNode),
    );

    setIsTitleEmpty(titleText.length === 0);
    setIsBodyEmpty(
      !bodyHasMeaningfulContent && bodyText.length === 0 && !hasCaretInBody,
    );
  }, [editorRef]);

  const {
    dragHandleTop,
    dragIndicatorTop,
    isDraggingBlock,
    clearHoveredDragBlock,
    finishBlockDrag,
    handleStartBlockDrag,
  } = useBlockDragAndDrop({
    editorRef,
    activeDocumentId,
    persistHtml,
    setDocuments,
    updateSavedRange,
    syncEditorEmptyState,
  });

  const getCurrentEditorHtml = useCallback(
    () => editorRef.current?.innerHTML ?? "",
    [editorRef],
  );

  const persistCurrentDocumentHtml = useCallback(() => {
    persistHtml();
    updateActiveDocumentContent(getCurrentEditorHtml());
  }, [getCurrentEditorHtml, persistHtml, updateActiveDocumentContent]);

  const applyHtmlToActiveDocument = useCallback(
    (nextHtml: string) => {
      applyExternalHtml(nextHtml);
      updateActiveDocumentContent(nextHtml);
    },
    [applyExternalHtml, updateActiveDocumentContent],
  );

  const { handleInputTransform } = useAutoTransforms({
    editorRef,
    savedRangeRef,
    moveCursorToEnd,
    persistHtml: persistCurrentDocumentHtml,
  });

  useMarkdownRenderer({
    editorRef,
    onHtmlChange: applyHtmlToActiveDocument,
    debounceMs: 500,
  });

  const { toolbarState, syncToolbarState } = useEditorToolbarState({
    editorRef,
  });

  const run = useCallback(
    (
      action: (context: {
        editor: HTMLDivElement;
        savedRange: Range | null;
      }) => void,
    ) => {
      const context = getCommandContext();

      if (!context) {
        return;
      }

      action(context);
      persistCurrentDocumentHtml();
      syncToolbarState();
    },
    [getCommandContext, persistCurrentDocumentHtml, syncToolbarState],
  );

  const {
    isImageDialogOpen,
    setIsImageDialogOpen,
    isLinkDialogOpen,
    setIsLinkDialogOpen,
    linkUrl,
    setLinkUrl,
    openLinkInNewTab,
    setOpenLinkInNewTab,
    handleLink,
    handleApplyLink,
    handleRemoveLink,
    handleImage,
    handleInsertImage,
    handleRemoveImage,
  } = useEditorDialogs({
    updateSavedRange,
    run,
  });

  const { handlePaste, handleEditorBeforeInput, handleEditorKeyDown } =
    useEditorContentHandlers({
      editorRef,
      persistHtml: persistCurrentDocumentHtml,
      updateSavedRange,
      syncToolbarState,
      run,
    });

  const handleHeading = (level: HeadingLevel) => {
    window.setTimeout(() => {
      run((context) => editorCommands.heading(context, level));
    }, 150);
  };

  const handleList = (type: ListType) => {
    run((context) => editorCommands.list(context, type));
  };

  const handleAlign = (align: AlignType) => {
    run((context) => editorCommands.align(context, align));
  };

  const handleMathChange = (value: string) => {
    window.setTimeout(() => {
      const selected = mathOptions.find((item) => item.value === value);

      if (!selected) {
        return;
      }

      run((context) => editorCommands.insertMath(context, selected.template));
    }, 150);
  };

  const insertMathShortcut = (value: string) => {
    run((context) => editorCommands.insertMath(context, value));
  };

  const handleRenderMarkdown = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const text = editor.innerText;
    const html = renderMarkdownToHtml(text);

    applyHtmlToActiveDocument(html);
  }, [editorRef, applyHtmlToActiveDocument]);

  // Atalho: Ctrl+Shift+M para renderizar Markdown
  useEffect(() => {
    if (!isHelpDialogOpen) {
      return;
    }

    try {
      localStorage.setItem(HELP_DIALOG_STORAGE_KEY, "1");
    } catch {
      // Ignore storage errors to avoid breaking editor usage.
    }
  }, [isHelpDialogOpen]);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "m") {
        e.preventDefault();
        handleRenderMarkdown();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleRenderMarkdown]);

  const handleCopyMarkdown = async () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const markdown = editorCommands.htmlToMarkdown(editor.innerHTML);

    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      return;
    }
  };

  const handleOpenHelpFromMenu = useCallback(() => {
    setIsHelpDialogOpen(true);
  }, []);

  const handleSaveDocument = useCallback(async () => {
    if (isSavingDocumentRef.current) {
      return;
    }

    isSavingDocumentRef.current = true;
    const savingToastId = toast.loading("Salvando documento...");
    try {
      persistCurrentDocumentHtml();

      if (!authToken || !authenticatedUser) {
        toast.success("Documento salvo.", { id: savingToastId });
        return;
      }

      const activeDocument = documents.find(
        (documentItem) => documentItem.id === activeDocumentId,
      );

      if (!activeDocument) {
        toast.error("Não foi possível localizar o documento ativo.", {
          id: savingToastId,
        });
        return;
      }

      const savedDocument = await upsertDocumentWithApi(
        authToken,
        activeDocument.id,
        {
          title: activeDocument.title?.trim() || DEFAULT_DOCUMENT_TITLE,
          content: activeDocument.content ?? "",
          isDraft: false,
        },
      );

      setDocuments((previousDocuments) =>
        previousDocuments.map((documentItem) => {
          if (documentItem.id !== activeDocument.id) {
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

      if (savedDocument.id !== activeDocument.id) {
        setActiveDocumentId(savedDocument.id);
      }

      toast.success("Documento salvo.", { id: savingToastId });
    } catch {
      // Keep local save even when API persistence fails.
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
    documents,
    persistCurrentDocumentHtml,
    setActiveDocumentId,
    setDocuments,
  ]);

  const handleExportDocument = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const markdown = editorCommands.htmlToMarkdown(editor.innerHTML);
    const activeDocument = documents.find(
      (documentItem) => documentItem.id === activeDocumentId,
    );
    const rawTitle = activeDocument?.title.trim() || DEFAULT_DOCUMENT_TITLE;
    const safeTitle = Array.from(rawTitle)
      .filter((character) => {
        const code = character.codePointAt(0) ?? 0;

        return (
          code >= 32 &&
          !["<", ">", ":", '"', "/", "\\", "|", "?", "*"].includes(character)
        );
      })
      .join("")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    const fileName = safeTitle.length > 0 ? safeTitle : "documento";
    const blob = new Blob([markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${fileName}.md`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [activeDocumentId, documents, editorRef]);

  const handleOpenImportDialog = useCallback(() => {
    setIsImportDialogOpen(true);
  }, []);

  const handleImportMarkdownDocument = useCallback(
    (markdown: string) => {
      const html = renderMarkdownToHtml(markdown);
      applyHtmlToActiveDocument(html);
      ensureTitleBlockWhenEditorIsEmpty();
      syncEditorEmptyState();
      syncToolbarState();
    },
    [
      applyHtmlToActiveDocument,
      ensureTitleBlockWhenEditorIsEmpty,
      syncEditorEmptyState,
      syncToolbarState,
    ],
  );

  const handleOpenGithub = useCallback(() => {
    window.open(
      "https://github.com/RazielID752",
      "_blank",
      "noopener,noreferrer",
    );
  }, []);

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

  const handleSetActiveDocument = useCallback(
    (nextDocumentId: string) => {
      if (nextDocumentId === activeDocumentId) {
        return;
      }

      persistCurrentDocumentHtml();
      setActiveDocumentId(nextDocumentId);
    },
    [activeDocumentId, persistCurrentDocumentHtml, setActiveDocumentId],
  );

  const handleCloseDocument = useCallback(
    async (documentId: string) => {
      if (!authToken || !authenticatedUser || !isGuid(documentId)) {
        handleCloseDocumentLocal(documentId);
        return;
      }

      const deletingToastId = toast.loading("Excluindo documento...");

      try {
        await deleteDocumentWithApi(authToken, documentId);
        handleCloseDocumentLocal(documentId);
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
    [authToken, authenticatedUser, handleCloseDocumentLocal],
  );

  useEffect(() => {
    const nextActiveDocument = documents.find(
      (documentItem) => documentItem.id === activeDocumentId,
    );
    const nextActiveDocumentHtml = nextActiveDocument?.content ?? "";
    const currentEditorHtml = getCurrentEditorHtml();
    const isSameActiveDocument =
      previousActiveDocumentIdRef.current === activeDocumentId;
    const isEditorAlreadySynced = currentEditorHtml === nextActiveDocumentHtml;

    if (isSameActiveDocument && isEditorAlreadySynced) {
      return;
    }

    previousActiveDocumentIdRef.current = activeDocumentId;

    applyExternalHtml(nextActiveDocumentHtml);
    finishBlockDrag();
    clearHoveredDragBlock();
    ensureEditorScaffoldWhenEmpty();
    updateSavedRange();
    const animationFrameId = window.requestAnimationFrame(() => {
      syncEditorEmptyState();
      syncToolbarState();
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [
    activeDocumentId,
    applyExternalHtml,
    clearHoveredDragBlock,
    documents,
    ensureEditorScaffoldWhenEmpty,
    finishBlockDrag,
    getCurrentEditorHtml,
    syncEditorEmptyState,
    syncToolbarState,
    updateSavedRange,
  ]);

  useEffect(() => {
    if (isCreateDialogOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const editor = editorRef.current;

      if (!editor) {
        return;
      }

      ensureTitleBlockWhenEditorIsEmpty({ moveCaretTo: "body" });
      editor.focus();
      updateSavedRange();
      syncEditorEmptyState();
      syncToolbarState();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    editorRef,
    ensureTitleBlockWhenEditorIsEmpty,
    isCreateDialogOpen,
    syncEditorEmptyState,
    syncToolbarState,
    updateSavedRange,
  ]);

  const handleIncreaseZoom = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleDecreaseZoom = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  return (
    <div
      className="relative min-h-screen bg-[radial-gradient(circle_at_top,#e7f7ef_0%,#f8fafc_45%,#ffffff_100%)] px-3 pb-6 sm:px-6 sm:pb-8"
      style={{
        fontSize: `${zoom}%`,
      }}
    >
      <ZoomControls
        zoom={zoom}
        onIncrease={handleIncreaseZoom}
        onDecrease={handleDecreaseZoom}
      />

      <EditorQuickMenu
        currentUser={
          authenticatedUser
            ? {
                name: authenticatedUser.name,
                email: authenticatedUser.email,
              }
            : null
        }
        onOpenHelp={handleOpenHelpFromMenu}
        onSave={handleSaveDocument}
        onExport={handleExportDocument}
        onImportMd={handleOpenImportDialog}
        onOpenGithub={handleOpenGithub}
        onLoginRequest={handleLogin}
        onLogoutRequest={handleLogoutRequest}
      />

      <DocumentTabsBar
        documents={documents}
        activeDocumentId={activeDocumentId}
        isCreateDialogOpen={isCreateDialogOpen}
        defaultDocumentTitle={DEFAULT_DOCUMENT_TITLE}
        onActiveDocumentChange={handleSetActiveDocument}
        onOpenCreateDialog={handleOpenCreateDocumentDialog}
        onCreateDocument={handleCreateDocument}
        onRenameDocument={handleRenameDocument}
        onCloseDocument={handleCloseDocument}
        onCreateDialogOpenChange={setIsCreateDialogOpen}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <EditorToolbar
          activeState={toolbarState}
          onUndo={() => run((context) => editorCommands.undo(context))}
          onRedo={() => run((context) => editorCommands.redo(context))}
          onHeadingChange={handleHeading}
          onBulletList={() => handleList("bullet")}
          onOrderedList={() => handleList("ordered")}
          onBlockquote={() =>
            run((context) => editorCommands.blockquote(context))
          }
          onCodeBlock={() =>
            run((context) => editorCommands.codeBlock(context))
          }
          onBold={() => run((context) => editorCommands.bold(context))}
          onItalic={() => run((context) => editorCommands.italic(context))}
          onStrike={() => run((context) => editorCommands.strike(context))}
          onInlineCode={() =>
            run((context) => editorCommands.inlineCode(context))
          }
          onUnderline={() =>
            run((context) => editorCommands.underline(context))
          }
          onHighlight={() =>
            run((context) => editorCommands.highlight(context))
          }
          onLink={handleLink}
          onSubscript={() =>
            run((context) => editorCommands.subscript(context))
          }
          onSuperscript={() =>
            run((context) => editorCommands.superscript(context))
          }
          onAlignLeft={() => handleAlign("left")}
          onAlignCenter={() => handleAlign("center")}
          onAlignRight={() => handleAlign("right")}
          onImage={handleImage}
          onMathChange={handleMathChange}
          onInsertEquals={() => insertMathShortcut(" = ")}
          onInsertSqrt={() => insertMathShortcut("sqrt()")}
          onInsertPow={() => insertMathShortcut("pow(,)")}
          onInsertPi={() => insertMathShortcut("pi")}
          onRenderMarkdown={handleRenderMarkdown}
          onCopyMarkdown={handleCopyMarkdown}
          onHelp={() => setIsHelpDialogOpen(true)}
        />

        <div className="p-3 sm:p-3">
          <div className="relative">
            {isTitleEmpty || isBodyEmpty ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 z-10 select-none"
              >
                {isTitleEmpty ? (
                  <p className="text-4xl font-bold text-zinc-300">
                    {TITLE_PLACEHOLDER}
                  </p>
                ) : null}
                {isBodyEmpty ? (
                  <p
                    className={`text-base text-zinc-400 ${isTitleEmpty ? "mt-5" : "mt-15"}`}
                  >
                    {BODY_PLACEHOLDER}
                  </p>
                ) : null}
              </div>
            ) : null}

            {dragHandleTop !== null ? (
              <button
                type="button"
                aria-label="Arrastar bloco"
                title="Arrastar bloco"
                onMouseDown={handleStartBlockDrag}
                className={`absolute -left-8 top-0 z-20 hidden size-6 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-emerald-200 hover:text-emerald-800 sm:flex ${isDraggingBlock ? "cursor-grabbing" : "cursor-grab"}`}
                style={{ top: `${dragHandleTop}px` }}
              >
                <GripVertical className="size-4" />
              </button>
            ) : null}

            {isDraggingBlock && dragIndicatorTop !== null ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-20 h-0.5 rounded-full bg-emerald-500/90"
                style={{ top: `${dragIndicatorTop}px` }}
              />
            ) : null}

            {/* biome-ignore lint/a11y/useSemanticElements: um editor rich text precisa de contentEditable para suportar blocos formatados. */}
            <div
              ref={editorRef}
              className={EDITOR_CONTENT_CLASSNAME}
              contentEditable
              tabIndex={0}
              role="textbox"
              aria-multiline="true"
              aria-label="Editor de texto do Calcify"
              suppressContentEditableWarning
              onInput={(event) => {
                handleInputTransform(event);
                persistCurrentDocumentHtml();
                ensureTitleBlockWhenEditorIsEmpty();
                syncEditorEmptyState();
                syncToolbarState();
              }}
              onBeforeInput={handleEditorBeforeInput}
              onPaste={handlePaste}
              onKeyDown={handleEditorKeyDown}
              onMouseUp={() => {
                updateSavedRange();
                syncEditorEmptyState();
                syncToolbarState();
              }}
              onKeyUp={() => {
                updateSavedRange();
                syncEditorEmptyState();
                syncToolbarState();
              }}
              onFocus={() => {
                ensureTitleBlockWhenEditorIsEmpty();
                updateSavedRange();
                syncEditorEmptyState();
                syncToolbarState();
              }}
              onBlur={() => {
                persistCurrentDocumentHtml();
                syncEditorEmptyState();
                syncToolbarState();
              }}
            />
          </div>

          <LinkDialog
            open={isLinkDialogOpen}
            onOpenChange={setIsLinkDialogOpen}
            linkUrl={linkUrl}
            onLinkUrlChange={setLinkUrl}
            openInNewTab={openLinkInNewTab}
            onOpenInNewTabChange={setOpenLinkInNewTab}
            onApplyLink={handleApplyLink}
            onRemoveLink={handleRemoveLink}
          />

          <ImageDialog
            open={isImageDialogOpen}
            onOpenChange={setIsImageDialogOpen}
            onInsertImage={handleInsertImage}
            onRemoveImage={handleRemoveImage}
          />

          <EditorHelpDialog
            open={isHelpDialogOpen}
            onOpenChange={setIsHelpDialogOpen}
          />

          <EditorLoginDialog
            open={isLoginDialogOpen}
            onOpenChange={(open) => {
              setIsLoginDialogOpen(open);
              if (!open) {
                setLoginErrorMessage("");
              }
            }}
            onContinueLogin={handleContinueLogin}
            isSubmitting={isLoginSubmitting}
            errorMessage={loginErrorMessage}
          />

          <EditorLogoutDialog
            open={isLogoutDialogOpen}
            isSubmitting={isLogoutSubmitting}
            onOpenChange={setIsLogoutDialogOpen}
            onConfirmLogout={handleConfirmLogout}
          />

          <EditorImportDialog
            open={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
            onImportMarkdown={handleImportMarkdownDocument}
          />
        </div>
      </div>
    </div>
  );
}
