import { type RefObject, useCallback, useEffect } from "react";
import { renderMarkdownToHtml } from "@/utils/render-markdown";

type UseEditorMarkdownShortcutOptions = {
  applyHtmlToActiveDocument: (html: string) => void;
  editorRef: RefObject<HTMLDivElement | null>;
  scheduleAutosave: () => void;
};

export const useEditorMarkdownShortcut = ({
  applyHtmlToActiveDocument,
  editorRef,
  scheduleAutosave,
}: UseEditorMarkdownShortcutOptions) => {
  const handleRenderMarkdown = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const text = editor.innerText;
    const html = renderMarkdownToHtml(text);

    applyHtmlToActiveDocument(html);
    scheduleAutosave();
  }, [editorRef, applyHtmlToActiveDocument, scheduleAutosave]);

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

  return {
    handleRenderMarkdown,
  };
};
