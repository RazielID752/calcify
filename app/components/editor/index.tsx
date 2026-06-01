"use client";

import { useRouter } from "next/navigation";
import { type MouseEvent, useCallback, useEffect, useState } from "react";
import DocumentLibraryDialog from "../document-library-dialog";
import DocumentTabsBar from "../document-tabs-bar";
import EditorBlockActionMenu, {
  type EditorBlockAction,
} from "../editor-block-action-menu";
import {
  type AlignType,
  editorCommands,
  type HeadingLevel,
  type ListType,
  mathOptions,
} from "../editor-commands";
import EditorDialogsStack from "../editor-dialogs-stack";
import { DEFAULT_DOCUMENT_TITLE, type Document } from "../editor-document";
import EditorDocumentOutline, {
  type EditorOutlineItem,
} from "../editor-document-outline";
import EditorFormattingToolbar from "../editor-formatting-toolbar";
import EditorQuickMenu from "../editor-quick-menu";
import EditorWritingSurface from "../editor-writing-surface";
import { useActiveEditorDocument } from "../hooks/use-active-editor-document";
import { useAutoTransforms } from "../hooks/use-auto-transforms";
import {
  BLOCK_ACTION_PLACEHOLDER_ATTRIBUTE,
  BLOCK_ACTION_PLACEHOLDER_CLASSNAME,
  BLOCK_ACTION_PLACEHOLDER_SELECTOR,
  useBlockDragAndDrop,
} from "../hooks/use-block-drag-and-drop";
import { useEditor } from "../hooks/use-editor";
import { useEditorContentHandlers } from "../hooks/use-editor-content-handlers";
import { useEditorDialogs } from "../hooks/use-editor-dialogs";
import { useEditorDocumentActions } from "../hooks/use-editor-document-actions";
import { useEditorDocuments } from "../hooks/use-editor-documents";
import { useEditorEmptyState } from "../hooks/use-editor-empty-state";
import { useEditorHelpDialog } from "../hooks/use-editor-help-dialog";
import { useEditorHistory } from "../hooks/use-editor-history";
import { useEditorMarkdownShortcut } from "../hooks/use-editor-markdown-shortcut";
import { useEditorSession } from "../hooks/use-editor-session";
import { useEditorToolbarState } from "../hooks/use-editor-toolbar-state";
import { useMarkdownRenderer } from "../hooks/use-markdown-renderer";
import ZoomControls from "../zoom-controls";

const OUTLINE_HEADING_SELECTOR = "h1,h2,h3,h4";
const EMPTY_OUTLINE_ITEM_INDEX = -1;
const OUTLINE_READING_LINE_VIEWPORT_RATIO = 0.35;
const PAGE_EDGE_THRESHOLD_PX = 8;
const BLOCK_ACTION_PLACEHOLDER_TEXT = "Digite ou escolha uma função";

const normalizeOutlineTitle = (value: string | null | undefined) =>
  value?.replace(/\s+/g, " ").trim() ?? "";

const isOutlineHeading = (element: Element): element is HTMLElement =>
  element instanceof HTMLElement &&
  Boolean(normalizeOutlineTitle(element.textContent));

const getOutlineHeadings = (editor: HTMLDivElement) =>
  [...editor.querySelectorAll(OUTLINE_HEADING_SELECTOR)].filter(
    isOutlineHeading,
  );

const getActiveOutlineItemIndex = (headings: HTMLElement[]) => {
  if (headings.length === 0) {
    return EMPTY_OUTLINE_ITEM_INDEX;
  }

  const pageScrollTop = window.scrollY;
  const pageScrollBottom = pageScrollTop + window.innerHeight;
  const pageHeight = document.documentElement.scrollHeight;

  if (pageScrollTop <= PAGE_EDGE_THRESHOLD_PX) {
    return 0;
  }

  if (pageScrollBottom >= pageHeight - PAGE_EDGE_THRESHOLD_PX) {
    return headings.length - 1;
  }

  const readingLineOffset =
    window.innerHeight * OUTLINE_READING_LINE_VIEWPORT_RATIO;

  const activeItemIndex = headings.reduce(
    (currentActiveItemIndex, heading, headingListIndex) => {
      return heading.getBoundingClientRect().top <= readingLineOffset
        ? headingListIndex
        : currentActiveItemIndex;
    },
    EMPTY_OUTLINE_ITEM_INDEX,
  );

  if (activeItemIndex === EMPTY_OUTLINE_ITEM_INDEX) {
    return 0;
  }

  return activeItemIndex;
};

const createOutlineItem = (
  heading: Element,
  headingIndex: number,
): EditorOutlineItem | null => {
  const title = normalizeOutlineTitle(heading.textContent);

  if (!title) {
    return null;
  }

  const level = Number(heading.tagName.slice(1)) as 1 | 2 | 3 | 4;

  return {
    headingIndex,
    id: `${headingIndex}-${level}-${title}`,
    level,
    title,
  };
};

const areOutlineItemsEqual = (
  currentItems: EditorOutlineItem[],
  nextItems: EditorOutlineItem[],
) => JSON.stringify(currentItems) === JSON.stringify(nextItems);

const isBlockActionPlaceholderElement = (
  element: Element | null,
): element is HTMLElement =>
  element instanceof HTMLElement &&
  element.matches(BLOCK_ACTION_PLACEHOLDER_SELECTOR);

const getBlockActionPlaceholderFromTarget = (target?: EventTarget | null) => {
  if (!(target instanceof Node)) {
    return null;
  }

  const targetElement =
    target.nodeType === Node.TEXT_NODE ? target.parentElement : target;

  if (!(targetElement instanceof Element)) {
    return null;
  }

  return targetElement.closest(BLOCK_ACTION_PLACEHOLDER_SELECTOR);
};

const removeBlockActionPlaceholderStyles = (element: HTMLElement) => {
  element.removeAttribute(BLOCK_ACTION_PLACEHOLDER_ATTRIBUTE);
  element.classList.remove(...BLOCK_ACTION_PLACEHOLDER_CLASSNAME.split(" "));
};

const removeBlockElement = (element: HTMLElement) => {
  const parentElement = element.parentElement;

  element.remove();

  if (
    parentElement instanceof HTMLElement &&
    (parentElement.tagName === "UL" || parentElement.tagName === "OL") &&
    parentElement.children.length === 0
  ) {
    parentElement.remove();
  }
};

export default function Editor() {
  const router = useRouter();
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
  const [isDocumentLibraryOpen, setIsDocumentLibraryOpen] = useState(false);
  const [blockActionMenuTop, setBlockActionMenuTop] = useState<number | null>(
    null,
  );
  const [outlineItems, setOutlineItems] = useState<EditorOutlineItem[]>([]);
  const [activeOutlineItemIndex, setActiveOutlineItemIndex] = useState(
    EMPTY_OUTLINE_ITEM_INDEX,
  );
  const { handleOpenHelpFromMenu, isHelpDialogOpen, setIsHelpDialogOpen } =
    useEditorHelpDialog();

  const {
    ensureEditorScaffoldWhenEmpty,
    ensureTitleBlockWhenEditorIsEmpty,
    isBodyEmpty,
    isTitleEmpty,
    syncEditorEmptyState,
  } = useEditorEmptyState({
    editorRef,
    moveCursorToEnd,
  });

  const {
    dragHandleTop,
    dragIndicatorTop,
    isDraggingBlock,
    clearHoveredDragBlock,
    clearPinnedDragBlock,
    finishBlockDrag,
    handleStartBlockDrag,
    insertBlockAfterHoveredBlock,
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

  const { recordHistorySnapshot, redoHistory, resetHistory, undoHistory } =
    useEditorHistory({
      getCurrentHtml: getCurrentEditorHtml,
      restoreHtml: (html) => {
        applyExternalHtml(html);
        updateActiveDocumentContent(html);
      },
    });

  const persistCurrentDocumentHtml = useCallback(() => {
    const nextHtml = getCurrentEditorHtml();

    persistHtml();
    updateActiveDocumentContent(nextHtml);
    recordHistorySnapshot(nextHtml);
  }, [
    getCurrentEditorHtml,
    persistHtml,
    recordHistorySnapshot,
    updateActiveDocumentContent,
  ]);

  const {
    authenticatedUser,
    authToken,
    flushAutosave,
    handleConfirmLogout,
    handleExpiredSession,
    handleLogoutRequest,
    handleSaveDocument,
    isLogoutDialogOpen,
    isLogoutSubmitting,
    scheduleAutosave,
    setIsLogoutDialogOpen,
  } = useEditor({
    documents,
    setDocuments,
    hadStoredDocuments,
    activeDocumentId,
    setActiveDocumentId,
    closeDocumentLocally: handleCloseDocumentLocal,
    persistCurrentDocumentHtml,
  });

  const applyActiveDocumentHtml = useCallback(
    (nextHtml: string) => {
      applyExternalHtml(nextHtml);
      resetHistory(nextHtml);
    },
    [applyExternalHtml, resetHistory],
  );

  const applyHtmlToActiveDocument = useCallback(
    (nextHtml: string) => {
      recordHistorySnapshot(nextHtml);
      applyExternalHtml(nextHtml);
      updateActiveDocumentContent(nextHtml);
    },
    [applyExternalHtml, recordHistorySnapshot, updateActiveDocumentContent],
  );

  const { toolbarState, syncToolbarState } = useEditorToolbarState({
    editorRef,
  });

  const {
    handleCopyMarkdown,
    handleExportDocument,
    handleExportPdf,
    handleImportMarkdownDocument,
    handleOpenGithub,
    handleOpenImportDialog,
    isImportDialogOpen,
    setIsImportDialogOpen,
  } = useEditorDocumentActions({
    activeDocumentId,
    applyHtmlToActiveDocument,
    documents,
    editorRef,
    ensureTitleBlockWhenEditorIsEmpty,
    scheduleAutosave,
    syncEditorEmptyState,
    syncToolbarState,
  });

  useActiveEditorDocument({
    activeDocumentId,
    applyExternalHtml: applyActiveDocumentHtml,
    clearHoveredDragBlock,
    documents,
    editorRef,
    ensureEditorScaffoldWhenEmpty,
    ensureTitleBlockWhenEditorIsEmpty,
    finishBlockDrag,
    getCurrentEditorHtml,
    isCreateDialogOpen,
    syncEditorEmptyState,
    syncToolbarState,
    updateSavedRange,
  });

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

  const syncActiveOutlineIndex = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      setActiveOutlineItemIndex(EMPTY_OUTLINE_ITEM_INDEX);
      return;
    }

    const nextActiveItemIndex = getActiveOutlineItemIndex(
      getOutlineHeadings(editor),
    );

    setActiveOutlineItemIndex((currentItemIndex) =>
      currentItemIndex === nextActiveItemIndex
        ? currentItemIndex
        : nextActiveItemIndex,
    );
  }, [editorRef]);

  const syncDocumentOutline = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      setOutlineItems([]);
      setActiveOutlineItemIndex(EMPTY_OUTLINE_ITEM_INDEX);
      return;
    }

    const nextOutlineItems = [
      ...editor.querySelectorAll(OUTLINE_HEADING_SELECTOR),
    ]
      .map(createOutlineItem)
      .filter((item): item is EditorOutlineItem => item !== null);

    setOutlineItems((currentItems) => {
      if (areOutlineItemsEqual(currentItems, nextOutlineItems)) {
        return currentItems;
      }

      return nextOutlineItems;
    });

    syncActiveOutlineIndex();
  }, [editorRef, syncActiveOutlineIndex]);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    let animationFrameId = window.requestAnimationFrame(syncDocumentOutline);
    const observer = new MutationObserver(() => {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(syncDocumentOutline);
    });

    observer.observe(editor, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [editorRef, syncDocumentOutline]);

  useEffect(() => {
    let animationFrameId = 0;

    const scheduleSyncActiveOutlineIndex = () => {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(syncActiveOutlineIndex);
    };

    scheduleSyncActiveOutlineIndex();
    window.addEventListener("scroll", scheduleSyncActiveOutlineIndex, {
      passive: true,
    });
    window.addEventListener("resize", scheduleSyncActiveOutlineIndex);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", scheduleSyncActiveOutlineIndex);
      window.removeEventListener("resize", scheduleSyncActiveOutlineIndex);
    };
  }, [syncActiveOutlineIndex]);

  const handleSelectOutlineItem = useCallback(
    (item: EditorOutlineItem) => {
      const editor = editorRef.current;

      if (!editor) {
        return;
      }

      const heading = editor
        .querySelectorAll(OUTLINE_HEADING_SELECTOR)
        .item(item.headingIndex);

      if (!(heading instanceof HTMLElement)) {
        return;
      }

      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveOutlineItemIndex((currentItemIndex) => {
        const selectedItemIndex = outlineItems.findIndex(
          (outlineItem) => outlineItem.id === item.id,
        );

        return selectedItemIndex >= 0 ? selectedItemIndex : currentItemIndex;
      });
      editor.focus({ preventScroll: true });
      window.requestAnimationFrame(syncActiveOutlineIndex);
    },
    [editorRef, outlineItems, syncActiveOutlineIndex],
  );

  const { handleRenderMarkdown } = useEditorMarkdownShortcut({
    applyHtmlToActiveDocument,
    editorRef,
    scheduleAutosave,
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
      scheduleAutosave();
      syncToolbarState();
    },
    [
      getCommandContext,
      persistCurrentDocumentHtml,
      scheduleAutosave,
      syncToolbarState,
    ],
  );

  const handleUndo = useCallback(() => {
    if (!undoHistory()) {
      return;
    }

    scheduleAutosave();
    syncEditorEmptyState();
    syncToolbarState();
  }, [scheduleAutosave, syncEditorEmptyState, syncToolbarState, undoHistory]);

  const handleRedo = useCallback(() => {
    if (!redoHistory()) {
      return;
    }

    scheduleAutosave();
    syncEditorEmptyState();
    syncToolbarState();
  }, [redoHistory, scheduleAutosave, syncEditorEmptyState, syncToolbarState]);

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
      onRedo: handleRedo,
      onUndo: handleUndo,
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

  const handleList = useCallback(
    (type: ListType) => {
      run((context) => editorCommands.list(context, type));
    },
    [run],
  );

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

  const insertMathShortcut = useCallback(
    (value: string) => {
      run((context) => editorCommands.insertMath(context, value));
    },
    [run],
  );

  const persistPlaceholderCleanup = useCallback(() => {
    persistCurrentDocumentHtml();
    scheduleAutosave();
    syncEditorEmptyState();
    syncToolbarState();
  }, [
    persistCurrentDocumentHtml,
    scheduleAutosave,
    syncEditorEmptyState,
    syncToolbarState,
  ]);

  const removeIdleBlockActionPlaceholder = useCallback(
    (target?: EventTarget | null) => {
      const editor = editorRef.current;

      if (!editor) {
        clearPinnedDragBlock();
        setBlockActionMenuTop(null);
        return;
      }

      const targetPlaceholder = getBlockActionPlaceholderFromTarget(target);

      if (targetPlaceholder && editor.contains(targetPlaceholder)) {
        clearPinnedDragBlock();
        setBlockActionMenuTop(null);
        return;
      }

      const placeholders = [
        ...editor.querySelectorAll(BLOCK_ACTION_PLACEHOLDER_SELECTOR),
      ];
      let removedPlaceholder = false;

      for (const placeholder of placeholders) {
        if (!isBlockActionPlaceholderElement(placeholder)) {
          continue;
        }

        if (placeholder.textContent?.trim()) {
          removeBlockActionPlaceholderStyles(placeholder);
          continue;
        }

        removeBlockElement(placeholder);
        removedPlaceholder = true;
      }

      setBlockActionMenuTop(null);
      clearPinnedDragBlock();

      if (removedPlaceholder) {
        persistPlaceholderCleanup();
      }
    },
    [clearPinnedDragBlock, editorRef, persistPlaceholderCleanup],
  );

  const clearEditedBlockActionPlaceholders = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    for (const placeholder of [
      ...editor.querySelectorAll(BLOCK_ACTION_PLACEHOLDER_SELECTOR),
    ]) {
      if (!isBlockActionPlaceholderElement(placeholder)) {
        continue;
      }

      if (placeholder.textContent?.trim()) {
        removeBlockActionPlaceholderStyles(placeholder);
      }
    }
  }, [editorRef]);

  const activateBlockActionPlaceholders = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    for (const placeholder of [
      ...editor.querySelectorAll(BLOCK_ACTION_PLACEHOLDER_SELECTOR),
    ]) {
      if (!isBlockActionPlaceholderElement(placeholder)) {
        continue;
      }

      removeBlockActionPlaceholderStyles(placeholder);
    }
  }, [editorRef]);

  const handleOpenBlockActionMenu = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const insertedBlock = insertBlockAfterHoveredBlock(
        BLOCK_ACTION_PLACEHOLDER_TEXT,
      );

      if (!insertedBlock) {
        return;
      }

      persistPlaceholderCleanup();
      setBlockActionMenuTop(insertedBlock.top);
    },
    [insertBlockAfterHoveredBlock, persistPlaceholderCleanup],
  );

  const handleBlockAction = useCallback(
    (action: EditorBlockAction) => {
      setBlockActionMenuTop(null);
      clearPinnedDragBlock();
      activateBlockActionPlaceholders();

      switch (action) {
        case "paragraph":
          run((context) => editorCommands.paragraph(context));
          return;
        case "heading1":
          run((context) => editorCommands.heading(context, "h1"));
          return;
        case "heading2":
          run((context) => editorCommands.heading(context, "h2"));
          return;
        case "heading3":
          run((context) => editorCommands.heading(context, "h3"));
          return;
        case "bulletList":
          handleList("bullet");
          return;
        case "orderedList":
          handleList("ordered");
          return;
        case "blockquote":
          run((context) => editorCommands.blockquote(context));
          return;
        case "codeBlock":
          run((context) => editorCommands.codeBlock(context));
          return;
        case "image":
          handleImage();
          return;
        case "calculation":
          insertMathShortcut(" = ");
          return;
      }
    },
    [
      activateBlockActionPlaceholders,
      clearPinnedDragBlock,
      handleImage,
      handleList,
      insertMathShortcut,
      run,
    ],
  );

  const handleSetActiveDocument = useCallback(
    (nextDocumentId: string) => {
      if (nextDocumentId === activeDocumentId) {
        return;
      }

      persistCurrentDocumentHtml();
      flushAutosave(activeDocumentId);
      setActiveDocumentId(nextDocumentId);
    },
    [
      activeDocumentId,
      flushAutosave,
      persistCurrentDocumentHtml,
      setActiveDocumentId,
    ],
  );

  const handleOpenLibraryDocument = useCallback(
    (documentItem: Document) => {
      if (documents.some((item) => item.id === documentItem.id)) {
        return;
      }

      persistCurrentDocumentHtml();
      flushAutosave(activeDocumentId);
      setDocuments((previousDocuments) => {
        if (
          previousDocuments.some(
            (previousDocument) => previousDocument.id === documentItem.id,
          )
        ) {
          return previousDocuments;
        }

        return [
          ...previousDocuments,
          {
            ...documentItem,
            titleMode: "manual",
          },
        ];
      });
      setActiveDocumentId(documentItem.id);
    },
    [
      activeDocumentId,
      documents,
      flushAutosave,
      persistCurrentDocumentHtml,
      setActiveDocumentId,
      setDocuments,
    ],
  );

  const handleCloseTabDocument = useCallback(
    (documentId: string) => {
      persistCurrentDocumentHtml();
      flushAutosave(documentId);
      handleCloseDocumentLocal(documentId);
    },
    [flushAutosave, handleCloseDocumentLocal, persistCurrentDocumentHtml],
  );

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
        onOpenDocuments={() => setIsDocumentLibraryOpen(true)}
        onSave={handleSaveDocument}
        onExport={handleExportDocument}
        onExportPdf={handleExportPdf}
        onImportMd={handleOpenImportDialog}
        onOpenGithub={handleOpenGithub}
        onLoginRequest={() => router.push("/login?next=/editor")}
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
        onCloseDocument={handleCloseTabDocument}
        onCreateDialogOpenChange={setIsCreateDialogOpen}
      />

      <DocumentLibraryDialog
        authToken={authToken}
        defaultDocumentTitle={DEFAULT_DOCUMENT_TITLE}
        documents={documents}
        open={isDocumentLibraryOpen}
        onDeleteOpenDocument={handleCloseDocumentLocal}
        onAuthExpired={handleExpiredSession}
        onOpenChange={setIsDocumentLibraryOpen}
        onOpenDocument={handleOpenLibraryDocument}
        onRenameDocument={handleRenameDocument}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <EditorFormattingToolbar
          activeState={toolbarState}
          run={run}
          onRedo={handleRedo}
          onAlign={handleAlign}
          onCopyMarkdown={handleCopyMarkdown}
          onHeadingChange={handleHeading}
          onHelp={() => setIsHelpDialogOpen(true)}
          onImage={handleImage}
          onInsertMathShortcut={insertMathShortcut}
          onLink={handleLink}
          onList={handleList}
          onMathChange={handleMathChange}
          onRenderMarkdown={handleRenderMarkdown}
          onUndo={handleUndo}
        />

        <div className="relative p-3 sm:p-3">
          <EditorDocumentOutline
            activeItemIndex={activeOutlineItemIndex}
            items={outlineItems}
            onSelect={handleSelectOutlineItem}
          />

          <EditorWritingSurface
            editorRef={editorRef}
            dragHandleTop={dragHandleTop}
            dragIndicatorTop={dragIndicatorTop}
            isBodyEmpty={isBodyEmpty}
            isDraggingBlock={isDraggingBlock}
            isTitleEmpty={isTitleEmpty}
            spellcheckPopover={null}
            onStartBlockDrag={handleStartBlockDrag}
            onOpenBlockActionMenu={handleOpenBlockActionMenu}
            onInput={(event) => {
              handleInputTransform(event);
              clearEditedBlockActionPlaceholders();
              persistCurrentDocumentHtml();
              scheduleAutosave();
              ensureTitleBlockWhenEditorIsEmpty();
              syncEditorEmptyState();
              syncToolbarState();
            }}
            onBeforeInput={handleEditorBeforeInput}
            onClick={() => undefined}
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
              removeIdleBlockActionPlaceholder();
              persistCurrentDocumentHtml();
              flushAutosave();
              syncEditorEmptyState();
              syncToolbarState();
            }}
          />

          {blockActionMenuTop !== null ? (
            <EditorBlockActionMenu
              top={blockActionMenuTop}
              onAction={handleBlockAction}
              onClose={removeIdleBlockActionPlaceholder}
            />
          ) : null}

          <EditorDialogsStack
            imageDialogOpen={isImageDialogOpen}
            importDialogOpen={isImportDialogOpen}
            linkDialogOpen={isLinkDialogOpen}
            linkUrl={linkUrl}
            logoutDialogOpen={isLogoutDialogOpen}
            openHelpDialog={isHelpDialogOpen}
            openLinkInNewTab={openLinkInNewTab}
            isLogoutSubmitting={isLogoutSubmitting}
            onApplyLink={handleApplyLink}
            onConfirmLogout={handleConfirmLogout}
            onHelpDialogOpenChange={setIsHelpDialogOpen}
            onImageDialogOpenChange={setIsImageDialogOpen}
            onImportDialogOpenChange={setIsImportDialogOpen}
            onImportMarkdown={handleImportMarkdownDocument}
            onInsertImage={handleInsertImage}
            onLinkDialogOpenChange={setIsLinkDialogOpen}
            onLinkUrlChange={setLinkUrl}
            onLogoutDialogOpenChange={setIsLogoutDialogOpen}
            onOpenLinkInNewTabChange={setOpenLinkInNewTab}
            onRemoveImage={handleRemoveImage}
            onRemoveLink={handleRemoveLink}
          />
        </div>
      </div>
    </div>
  );
}
