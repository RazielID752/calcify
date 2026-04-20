"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import EditorToolbar from "./editor-toolbar";
import { useAutoTransforms } from "./hooks/use-auto-transforms";
import { useEditorContentHandlers } from "./hooks/use-editor-content-handlers";
import { useEditorDialogs } from "./hooks/use-editor-dialogs";
import { useEditorSession } from "./hooks/use-editor-session";
import { useEditorToolbarState } from "./hooks/use-editor-toolbar-state";
import { useMarkdownRenderer } from "./hooks/use-markdown-renderer";
import ImageDialog from "./image-dialog";
import LinkDialog from "./link-dialog";
import ZoomControls from "./zoom-controls";

type Document = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  titleMode: "auto" | "manual";
};

const DEFAULT_DOCUMENT_TITLE = "documento sem título";
const MAX_AUTO_TITLE_LENGTH = 32;

const trimAndCollapseWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const shortenTitle = (value: string) => {
  const normalized = trimAndCollapseWhitespace(value);

  if (normalized.length <= MAX_AUTO_TITLE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_AUTO_TITLE_LENGTH).trimEnd()}...`;
};

const getAutoTitleFromContent = (content: string) => {
  if (!content || typeof document === "undefined") {
    return DEFAULT_DOCUMENT_TITLE;
  }

  const container = document.createElement("div");
  container.innerHTML = content;

  const firstHeading = container.querySelector("h1");
  const headingText = trimAndCollapseWhitespace(
    firstHeading?.textContent ?? "",
  );

  if (!headingText) {
    return DEFAULT_DOCUMENT_TITLE;
  }

  return shortenTitle(headingText);
};

const createDocumentId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createBlankDocument = (initialTitle = ""): Document => {
  const normalizedTitle = trimAndCollapseWhitespace(initialTitle);

  return {
    id: createDocumentId(),
    title: normalizedTitle || DEFAULT_DOCUMENT_TITLE,
    content: "",
    createdAt: new Date(),
    titleMode: normalizedTitle ? "manual" : "auto",
  };
};

export default function Editor() {
  const initialDocumentRef = useRef<Document>(createBlankDocument());
  const [documents, setDocuments] = useState<Document[]>(() => [
    initialDocumentRef.current,
  ]);
  const [activeDocumentId, setActiveDocumentId] = useState<string>(
    initialDocumentRef.current.id,
  );
  const previousActiveDocumentIdRef = useRef<string>(
    initialDocumentRef.current.id,
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
    initialHtml: initialDocumentRef.current.content,
  });

  const [zoom, setZoom] = useState(100);

  const updateActiveDocumentContent = useCallback(
    (nextContent?: string) => {
      const content = nextContent ?? editorRef.current?.innerHTML ?? "";

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
    [activeDocumentId, editorRef],
  );

  const persistCurrentDocumentHtml = useCallback(() => {
    persistHtml();
    updateActiveDocumentContent();
  }, [persistHtml, updateActiveDocumentContent]);

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
    updateSavedRange,
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

  const handleSetActiveDocument = useCallback(
    (nextDocumentId: string) => {
      if (nextDocumentId === activeDocumentId) {
        return;
      }

      persistCurrentDocumentHtml();
      setActiveDocumentId(nextDocumentId);
    },
    [activeDocumentId, persistCurrentDocumentHtml],
  );

  const handleOpenCreateDocumentDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateDocument = useCallback((initialTitle: string) => {
    const newDocument = createBlankDocument(initialTitle);

    setDocuments((previousDocuments) => [...previousDocuments, newDocument]);
    setActiveDocumentId(newDocument.id);
    setIsCreateDialogOpen(false);
  }, []);

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

  useEffect(() => {
    if (previousActiveDocumentIdRef.current === activeDocumentId) {
      return;
    }

    previousActiveDocumentIdRef.current = activeDocumentId;

    const nextActiveDocument = documents.find(
      (documentItem) => documentItem.id === activeDocumentId,
    );

    applyExternalHtml(nextActiveDocument?.content ?? "");
    updateSavedRange();
    syncToolbarState();
  }, [
    activeDocumentId,
    applyExternalHtml,
    documents,
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

      editor.focus();
      updateSavedRange();
      syncToolbarState();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [editorRef, isCreateDialogOpen, syncToolbarState, updateSavedRange]);

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

      <DocumentTabsBar
        documents={documents}
        activeDocumentId={activeDocumentId}
        isCreateDialogOpen={isCreateDialogOpen}
        defaultDocumentTitle={DEFAULT_DOCUMENT_TITLE}
        onActiveDocumentChange={handleSetActiveDocument}
        onOpenCreateDialog={handleOpenCreateDocumentDialog}
        onCreateDocument={handleCreateDocument}
        onRenameDocument={handleRenameDocument}
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
        />

        <div className="p-3 sm:p-3">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: um editor rich text obrigatoriamente precisa usar uma div com contentEditable. */}
          <div
            ref={editorRef}
            className={EDITOR_CONTENT_CLASSNAME}
            data-placeholder="Digite algum texto..."
            contentEditable
            suppressContentEditableWarning
            onInput={(event) => {
              handleInputTransform(event);
              syncToolbarState();
            }}
            onBeforeInput={handleEditorBeforeInput}
            onPaste={handlePaste}
            onKeyDown={handleEditorKeyDown}
            onMouseUp={() => {
              updateSavedRange();
              syncToolbarState();
            }}
            onKeyUp={() => {
              updateSavedRange();
              syncToolbarState();
            }}
            onFocus={() => {
              updateSavedRange();
              syncToolbarState();
            }}
            onBlur={() => {
              persistCurrentDocumentHtml();
              syncToolbarState();
            }}
          />

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
        </div>
      </div>
    </div>
  );
}
