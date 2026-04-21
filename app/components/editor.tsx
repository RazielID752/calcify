"use client";

import { GripVertical } from "lucide-react";
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
import {
  BODY_PLACEHOLDER,
  DEFAULT_DOCUMENT_TITLE,
  hasMeaningfulEditorContent,
  TITLE_PLACEHOLDER,
} from "./editor-document";
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
  const {
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
  } = useEditorDocuments();
  const previousActiveDocumentIdRef = useRef<string>(activeDocumentId);

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
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);

  const ensureTitleBlockWhenEditorIsEmpty = useCallback(
    (options?: { moveCaretToTitle?: boolean }) => {
      const editor = editorRef.current;

      if (!editor) {
        return;
      }

      const html = editor.innerHTML;
      const isEmpty = !hasMeaningfulEditorContent(html);

      if (!isEmpty) {
        setIsEditorEmpty(false);
        return;
      }

      const firstElement = editor.firstElementChild;
      const firstElementIsTitle =
        firstElement instanceof HTMLHeadingElement &&
        firstElement.tagName === "H1" &&
        editor.children.length === 1;

      if (!firstElementIsTitle) {
        editor.innerHTML = "<h1><br></h1>";
      }

      const titleElement = editor.querySelector("h1");

      if (options?.moveCaretToTitle && titleElement instanceof HTMLElement) {
        moveCursorToEnd(titleElement);
      }

      setIsEditorEmpty(true);
    },
    [editorRef, moveCursorToEnd],
  );

  const syncEditorEmptyState = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";
    setIsEditorEmpty(!hasMeaningfulEditorContent(html));
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
    [activeDocumentId, persistCurrentDocumentHtml, setActiveDocumentId],
  );

  useEffect(() => {
    if (previousActiveDocumentIdRef.current === activeDocumentId) {
      return;
    }

    previousActiveDocumentIdRef.current = activeDocumentId;

    const nextActiveDocument = documents.find(
      (documentItem) => documentItem.id === activeDocumentId,
    );

    applyExternalHtml(nextActiveDocument?.content ?? "");
    finishBlockDrag();
    clearHoveredDragBlock();
    ensureTitleBlockWhenEditorIsEmpty();
    updateSavedRange();
    syncEditorEmptyState();
    syncToolbarState();
  }, [
    activeDocumentId,
    applyExternalHtml,
    clearHoveredDragBlock,
    documents,
    ensureTitleBlockWhenEditorIsEmpty,
    finishBlockDrag,
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

      ensureTitleBlockWhenEditorIsEmpty({ moveCaretToTitle: true });
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
        />

        <div className="p-3 sm:p-3">
          <div className="relative">
            {isEditorEmpty ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 z-10 select-none"
              >
                <p className="text-4xl font-bold text-zinc-300">
                  {TITLE_PLACEHOLDER}
                </p>
                <p className="mt-5 text-base text-zinc-400">
                  {BODY_PLACEHOLDER}
                </p>
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

            {/* biome-ignore lint/a11y/noStaticElementInteractions: um editor rich text obrigatoriamente precisa usar uma div com contentEditable. */}
            <div
              ref={editorRef}
              className={EDITOR_CONTENT_CLASSNAME}
              contentEditable
              suppressContentEditableWarning
              onInput={(event) => {
                handleInputTransform(event);
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
                ensureTitleBlockWhenEditorIsEmpty({ moveCaretToTitle: true });
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
        </div>
      </div>
    </div>
  );
}
