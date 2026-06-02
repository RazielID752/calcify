"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeEditorContentStructure } from "./editor-content-utils";

const DEFAULT_STORAGE_KEY = "customRichEditorHtml";

type UseEditorSessionOptions = {
  storageKey?: string | null;
  initialHtml?: string;
};

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

const saveHtmlValueToStorage = (
  storageKey: string | null | undefined,
  nextHtml: string,
  lastSavedHtmlRef: { current: string },
) => {
  if (!storageKey) {
    lastSavedHtmlRef.current = nextHtml;
    return;
  }

  try {
    localStorage.setItem(storageKey, nextHtml);
    lastSavedHtmlRef.current = nextHtml;
  } catch {
    // Ignore storage errors (quota/private mode) to avoid breaking editor usage.
  }
};

export function useEditorSession(options: UseEditorSessionOptions = {}) {
  const { storageKey = DEFAULT_STORAGE_KEY, initialHtml = "" } = options;

  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastSavedHtmlRef = useRef(initialHtml);
  const [html, setHtml] = useState(initialHtml);

  const saveHtmlToStorage = useCallback(
    (nextHtml: string) => {
      saveHtmlValueToStorage(storageKey, nextHtml, lastSavedHtmlRef);
    },
    [storageKey],
  );

  useEffect(() => {
    if (!storageKey || process.env.NODE_ENV !== "production") {
      return;
    }

    try {
      const savedHtml = localStorage.getItem(storageKey);

      if (savedHtml) {
        setHtml(savedHtml);
        lastSavedHtmlRef.current = savedHtml;
      }
    } catch {
      // Ignore read errors and keep editor usable.
    }
  }, [storageKey]);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor || editor.innerHTML === html) {
      return;
    }

    editor.innerHTML = html;
    const changed = normalizeEditorContentStructure(editor);

    if (changed) {
      const normalizedHtml = editor.innerHTML;
      setHtml(normalizedHtml);
      saveHtmlValueToStorage(storageKey, normalizedHtml, lastSavedHtmlRef);
    }
  }, [html, storageKey]);

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

    normalizeEditorContentStructure(editor);

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
      normalizeEditorContentStructure(editor);

      const normalizedHtml = editor.innerHTML;
      setHtml(normalizedHtml);
      saveHtmlToStorage(normalizedHtml);
      restoreSelectionToEnd();
    },
    [restoreSelectionToEnd, saveHtmlToStorage],
  );

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const autosave = () => {
      const editor = editorRef.current;

      if (!editor) {
        return;
      }

      normalizeEditorContentStructure(editor);

      const nextHtml = editor.innerHTML;

      if (nextHtml !== lastSavedHtmlRef.current) {
        saveHtmlToStorage(nextHtml);
      }
    };

    const intervalId = window.setInterval(autosave, 5000);

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
  }, [saveHtmlToStorage, storageKey]);

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
