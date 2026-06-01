"use client";

import type { RefObject } from "react";
import { useEditorKeyHandlers } from "./use-editor-key-handlers";
import { useEditorPasteHandlers } from "./use-editor-paste-handlers";

type EditorAction = (context: {
  editor: HTMLDivElement;
  savedRange: Range | null;
}) => void;

type UseEditorContentHandlersParams = {
  editorRef: RefObject<HTMLDivElement | null>;
  onRedo: () => void;
  onUndo: () => void;
  persistHtml: () => void;
  updateSavedRange: () => void;
  syncToolbarState: () => void;
  run: (action: EditorAction) => void;
};

export function useEditorContentHandlers({
  editorRef,
  onRedo,
  onUndo,
  persistHtml,
  updateSavedRange,
  syncToolbarState,
  run,
}: UseEditorContentHandlersParams) {
  const { handlePaste } = useEditorPasteHandlers({
    persistHtml,
    updateSavedRange,
    syncToolbarState,
  });

  const { handleEditorBeforeInput, handleEditorKeyDown } = useEditorKeyHandlers({
    editorRef,
    onRedo,
    onUndo,
    persistHtml,
    updateSavedRange,
    syncToolbarState,
    run,
  });

  return {
    handlePaste,
    handleEditorBeforeInput,
    handleEditorKeyDown,
  };
}
