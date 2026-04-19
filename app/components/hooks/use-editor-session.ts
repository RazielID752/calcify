"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "customRichEditorHtml";

const moveCaretToEnd = (element: HTMLElement) => {
  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

export function useEditorSession() {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [html, setHtml] = useState("");

  useEffect(() => {
    const savedHtml = localStorage.getItem(STORAGE_KEY);

    if (savedHtml) {
      setHtml(savedHtml);
    }
  }, []);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor || editor.innerHTML === html) {
      return;
    }

    editor.innerHTML = html;
  }, [html]);

  const updateSavedRange = useCallback(() => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (!editorRef.current?.contains(range.commonAncestorContainer)) {
      return;
    }

    savedRangeRef.current = range.cloneRange();
  }, []);

  const persistHtml = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const nextHtml = editor.innerHTML;
    setHtml(nextHtml);
    localStorage.setItem(STORAGE_KEY, nextHtml);
    updateSavedRange();
  }, [updateSavedRange]);

  const restoreSelectionToEnd = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.focus();
    moveCaretToEnd(editor);
    updateSavedRange();
  }, [updateSavedRange]);

  const applyExternalHtml = useCallback(
    (nextHtml: string) => {
      const editor = editorRef.current;

      if (!editor) {
        return;
      }

      editor.innerHTML = nextHtml;
      setHtml(nextHtml);
      localStorage.setItem(STORAGE_KEY, nextHtml);
      restoreSelectionToEnd();
    },
    [restoreSelectionToEnd],
  );

  const getCommandContext = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return null;
    }

    const selection = window.getSelection();
    const liveRange =
      selection && selection.rangeCount > 0
        ? selection.getRangeAt(0).cloneRange()
        : savedRangeRef.current;

    return {
      editor,
      savedRange: liveRange,
    };
  }, []);

  return {
    editorRef,
    savedRangeRef,
    html,
    updateSavedRange,
    persistHtml,
    restoreSelectionToEnd,
    applyExternalHtml,
    getCommandContext,
    moveCursorToEnd: moveCaretToEnd,
  };
}
