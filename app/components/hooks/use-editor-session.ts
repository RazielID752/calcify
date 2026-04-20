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
  const lastSavedHtmlRef = useRef("");
  const [html, setHtml] = useState("");

  const saveHtmlToStorage = useCallback((nextHtml: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, nextHtml);
      lastSavedHtmlRef.current = nextHtml;
    } catch {
      // Ignore storage errors (quota/private mode) to avoid breaking editor usage.
    }
  }, []);

  useEffect(() => {
    try {
      const savedHtml = localStorage.getItem(STORAGE_KEY);

      if (savedHtml) {
        setHtml(savedHtml);
        lastSavedHtmlRef.current = savedHtml;
      }
    } catch {
      // Ignore read errors and keep editor usable.
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
    saveHtmlToStorage(nextHtml);
    updateSavedRange();
  }, [saveHtmlToStorage, updateSavedRange]);

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
      saveHtmlToStorage(nextHtml);
      restoreSelectionToEnd();
    },
    [restoreSelectionToEnd, saveHtmlToStorage],
  );

  useEffect(() => {
    const autosave = () => {
      const editor = editorRef.current;

      if (!editor) {
        return;
      }

      const nextHtml = editor.innerHTML;

      if (nextHtml !== lastSavedHtmlRef.current) {
        saveHtmlToStorage(nextHtml);
      }
    };

    const intervalId = window.setInterval(autosave, 1500);

    const flushAutosave = () => {
      autosave();
    };

    window.addEventListener("beforeunload", flushAutosave);
    document.addEventListener("visibilitychange", flushAutosave);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("beforeunload", flushAutosave);
      document.removeEventListener("visibilitychange", flushAutosave);
    };
  }, [saveHtmlToStorage]);

  const getCommandContext = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return null;
    }

    const selection = window.getSelection();
    const liveRange =
      selection && selection.rangeCount > 0
        ? selection.getRangeAt(0).cloneRange()
        : null;

    const activeRange =
      liveRange && editor.contains(liveRange.commonAncestorContainer)
        ? liveRange
        : savedRangeRef.current;

    return {
      editor,
      savedRange: activeRange,
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
