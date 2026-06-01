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

const getActiveDocumentTitle = (
  documents: Document[],
  activeDocumentId: string,
) => {
  const activeDocument = documents.find(
    (documentItem) => documentItem.id === activeDocumentId,
  );

  return activeDocument?.title.trim() || DEFAULT_DOCUMENT_TITLE;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getPrintableDocumentHtml = (title: string, content: string) => `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page { margin: 18mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #18181b;
        background: #ffffff;
        font: 14px/1.65 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main { max-width: 760px; margin: 0 auto; }
      h1, h2, h3, h4 { color: #18181b; line-height: 1.2; page-break-after: avoid; }
      h1 { font-size: 30px; margin: 0 0 18px; }
      h2 { font-size: 22px; margin: 26px 0 10px; }
      h3 { font-size: 18px; margin: 22px 0 8px; }
      h4 { font-size: 15px; margin: 18px 0 6px; }
      p { margin: 0 0 10px; }
      ul, ol { padding-left: 22px; margin: 0 0 12px; }
      blockquote {
        margin: 14px 0;
        padding-left: 12px;
        border-left: 3px solid #10b981;
        color: #3f3f46;
      }
      pre {
        white-space: pre-wrap;
        border: 1px solid #e4e4e7;
        border-radius: 8px;
        background: #f4f4f5;
        padding: 12px;
      }
      code {
        border-radius: 5px;
        background: #f4f4f5;
        padding: 1px 4px;
      }
      img { max-width: 100%; height: auto; }
      [data-calc-result="true"] { color: #059669; font-weight: 700; }
    </style>
  </head>
  <body>
    <main>${content}</main>
  </body>
</html>`;

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
    const rawTitle = getActiveDocumentTitle(documents, activeDocumentId);
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

  const handleExportPdf = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const rawTitle = getActiveDocumentTitle(documents, activeDocumentId);
    const printFrame = document.createElement("iframe");

    printFrame.title = "Exportar PDF";
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "1px";
    printFrame.style.height = "1px";
    printFrame.style.border = "0";
    printFrame.style.opacity = "0";
    printFrame.setAttribute("aria-hidden", "true");
    document.body.append(printFrame);

    const printDocument =
      printFrame.contentDocument ?? printFrame.contentWindow?.document;

    if (!printDocument) {
      printFrame.remove();
      return;
    }

    let didPrint = false;
    let didCleanup = false;

    const cleanupPrintFrame = () => {
      if (didCleanup) {
        return;
      }

      didCleanup = true;
      printFrame.remove();
    };

    const triggerPrint = () => {
      const printWindow = printFrame.contentWindow;

      if (didPrint || !printWindow) {
        return;
      }

      didPrint = true;
      printWindow.focus();
      printWindow.print();
      window.setTimeout(cleanupPrintFrame, 30000);
    };

    printFrame.onload = () => {
      window.setTimeout(triggerPrint, 100);
    };

    printFrame.contentWindow?.addEventListener("afterprint", () => {
      window.setTimeout(cleanupPrintFrame, 300);
    });

    printDocument.open();
    printDocument.write(getPrintableDocumentHtml(rawTitle, editor.innerHTML));
    printDocument.close();

    if (printDocument.readyState === "complete") {
      window.setTimeout(triggerPrint, 100);
      return;
    }

    window.setTimeout(triggerPrint, 500);
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
    handleExportPdf,
    handleImportMarkdownDocument,
    handleOpenGithub,
    handleOpenImportDialog,
    isImportDialogOpen,
    setIsImportDialogOpen,
  };
};
