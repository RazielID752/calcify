"use client";

import DOMPurify from "dompurify";
import { type ClipboardEvent, useCallback } from "react";
import { editorCommands } from "../editor-commands";

type UseEditorPasteHandlersParams = {
  persistHtml: () => void;
  updateSavedRange: () => void;
  syncToolbarState: () => void;
};

export function useEditorPasteHandlers({
  persistHtml,
  updateSavedRange,
  syncToolbarState,
}: UseEditorPasteHandlersParams) {
  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      const htmlData = event.clipboardData.getData("text/html");
      const textData = event.clipboardData.getData("text/plain");

      if (htmlData) {
        event.preventDefault();
        const sanitizedHtml = DOMPurify.sanitize(htmlData);
        document.execCommand("insertHTML", false, sanitizedHtml);
        persistHtml();
        syncToolbarState();
        updateSavedRange();
        return;
      }

      if (textData) {
        event.preventDefault();
        const renderedHtml = editorCommands.markdownToHtml(textData);
        document.execCommand("insertHTML", false, renderedHtml);
        persistHtml();
        syncToolbarState();
        updateSavedRange();
      }
    },
    [persistHtml, syncToolbarState, updateSavedRange],
  );

  return {
    handlePaste,
  };
}
