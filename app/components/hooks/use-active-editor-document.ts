import { type RefObject, useEffect, useRef } from "react";
import type { Document } from "../editor-document";

type UseActiveEditorDocumentOptions = {
  activeDocumentId: string;
  applyExternalHtml: (html: string) => void;
  clearHoveredDragBlock: () => void;
  documents: Document[];
  editorRef: RefObject<HTMLDivElement | null>;
  ensureEditorScaffoldWhenEmpty: () => boolean;
  ensureTitleBlockWhenEditorIsEmpty: (options?: {
    moveCaretTo?: "title" | "body";
  }) => boolean;
  finishBlockDrag: () => void;
  getCurrentEditorHtml: () => string;
  isCreateDialogOpen: boolean;
  syncEditorEmptyState: () => void;
  syncToolbarState: () => void;
  updateSavedRange: () => void;
};

export const useActiveEditorDocument = ({
  activeDocumentId,
  applyExternalHtml,
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
}: UseActiveEditorDocumentOptions) => {
  const previousActiveDocumentIdRef = useRef<string>(activeDocumentId);

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
};
