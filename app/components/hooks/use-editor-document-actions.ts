import { type RefObject, useCallback, useState } from "react";
import { renderMarkdownToHtml } from "@/utils/render-markdown";
import { editorCommands } from "../editor-commands";
import { DEFAULT_DOCUMENT_TITLE, type Document } from "../editor-document";

type UseEditorDocumentActionsOptions = {
  activeDocumentId: string;
  applyHtmlToActiveDocument: (html: string) => void;
  documents: Document[];
  editorRef: RefObject<HTMLDivElement | null>;
  ensureTitleBlockWhenEditorIsEmpty: () => void;
  scheduleAutosave: () => void;
  syncEditorEmptyState: () => void;
  syncToolbarState: () => void;
};

const getSafeMarkdownFileName = (rawTitle: string) => {
  const safeTitle = Array.from(rawTitle)
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;

      return (
        code >= 32 &&
        !["<", ">", ":", '"', "/", "\\", "|", "?", "*"].includes(character)
      );
    })
    .join("")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return safeTitle.length > 0 ? safeTitle : "documento";
};

export const useEditorDocumentActions = ({
  activeDocumentId,
  applyHtmlToActiveDocument,
  documents,
  editorRef,
  ensureTitleBlockWhenEditorIsEmpty,
  scheduleAutosave,
  syncEditorEmptyState,
  syncToolbarState,
}: UseEditorDocumentActionsOptions) => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

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

  const handleExportDocument = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const markdown = editorCommands.htmlToMarkdown(editor.innerHTML);
    const activeDocument = documents.find(
      (documentItem) => documentItem.id === activeDocumentId,
    );
    const rawTitle = activeDocument?.title.trim() || DEFAULT_DOCUMENT_TITLE;
    const fileName = getSafeMarkdownFileName(rawTitle);
    const blob = new Blob([markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${fileName}.md`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [activeDocumentId, documents, editorRef]);

  const handleOpenImportDialog = useCallback(() => {
    setIsImportDialogOpen(true);
  }, []);

  const handleImportMarkdownDocument = useCallback(
    (markdown: string) => {
      const html = renderMarkdownToHtml(markdown);
      applyHtmlToActiveDocument(html);
      scheduleAutosave();
      ensureTitleBlockWhenEditorIsEmpty();
      syncEditorEmptyState();
      syncToolbarState();
    },
    [
      applyHtmlToActiveDocument,
      ensureTitleBlockWhenEditorIsEmpty,
      scheduleAutosave,
      syncEditorEmptyState,
      syncToolbarState,
    ],
  );

  const handleOpenGithub = useCallback(() => {
    window.open(
      "https://github.com/RazielID752",
      "_blank",
      "noopener,noreferrer",
    );
  }, []);

  return {
    handleCopyMarkdown,
    handleExportDocument,
    handleImportMarkdownDocument,
    handleOpenGithub,
    handleOpenImportDialog,
    isImportDialogOpen,
    setIsImportDialogOpen,
  };
};
