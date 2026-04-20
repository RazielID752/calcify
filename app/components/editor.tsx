"use client";

import { useCallback, useEffect, useState } from "react";
import { renderMarkdownToHtml } from "@/utils/render-markdown";
import {
  type AlignType,
  editorCommands,
  type HeadingLevel,
  type ListType,
  mathOptions,
} from "./editor-commands";
import { EDITOR_CONTENT_CLASSNAME } from "./editor-content-classname";
import EditorToolbar from "./editor-toolbar";
import { useAutoTransforms } from "./hooks/use-auto-transforms";
import { useEditorContentHandlers } from "./hooks/use-editor-content-handlers";
import { useEditorDialogs } from "./hooks/use-editor-dialogs";
import { useEditorSession } from "./hooks/use-editor-session";
import { useEditorToolbarState } from "./hooks/use-editor-toolbar-state";
import { useMarkdownRenderer } from "./hooks/use-markdown-renderer";
import ImageDialog from "./image-dialog";
import LinkDialog from "./link-dialog";
import ZoomControls from "./zoom-controls";

export default function Editor() {
  const {
    editorRef,
    getCommandContext,
    updateSavedRange,
    persistHtml,
    applyExternalHtml,
    moveCursorToEnd,
    savedRangeRef,
  } = useEditorSession();

  const [zoom, setZoom] = useState(100);

  const { handleInputTransform } = useAutoTransforms({
    editorRef,
    savedRangeRef,
    moveCursorToEnd,
    persistHtml,
  });

  useMarkdownRenderer({
    editorRef,
    onHtmlChange: applyExternalHtml,
    debounceMs: 500,
  });

  const { toolbarState, syncToolbarState } = useEditorToolbarState({
    editorRef,
    updateSavedRange,
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
      persistHtml();
      syncToolbarState();
    },
    [getCommandContext, persistHtml, syncToolbarState],
  );

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
      persistHtml,
      updateSavedRange,
      syncToolbarState,
      run,
    });

  const handleHeading = (level: HeadingLevel) => {
    window.setTimeout(() => {
      run((context) => editorCommands.heading(context, level));
    }, 150);
  };

  const handleList = (type: ListType) => {
    run((context) => editorCommands.list(context, type));
  };

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

  const insertMathShortcut = (value: string) => {
    run((context) => editorCommands.insertMath(context, value));
  };

  const handleRenderMarkdown = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const text = editor.innerText;
    const html = renderMarkdownToHtml(text);

    applyExternalHtml(html);
  }, [editorRef, applyExternalHtml]);

  // Atalho: Ctrl+Shift+M para renderizar Markdown
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

  const handleIncreaseZoom = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleDecreaseZoom = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  return (
    <div
      className="relative min-h-screen bg-[radial-gradient(circle_at_top,#e7f7ef_0%,#f8fafc_45%,#ffffff_100%)] px-3 py-6 sm:px-6 sm:py-8"
      style={{
        fontSize: `${zoom}%`,
      }}
    >
      <ZoomControls
        zoom={zoom}
        onIncrease={handleIncreaseZoom}
        onDecrease={handleDecreaseZoom}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <div className="space-y-1 px-1 flex justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">Calcify</h1>
          <p className="text-[10px] max-w-[35ch] md:text-sm text-zinc-600">
            Use markdown, formatação e calculos como `20 + 15 =` para calcular
            automaticamente.
          </p>
        </div>

        <EditorToolbar
          activeState={toolbarState}
          onUndo={() => run((context) => editorCommands.undo(context))}
          onRedo={() => run((context) => editorCommands.redo(context))}
          onHeadingChange={handleHeading}
          onBulletList={() => handleList("bullet")}
          onOrderedList={() => handleList("ordered")}
          onBlockquote={() =>
            run((context) => editorCommands.blockquote(context))
          }
          onCodeBlock={() =>
            run((context) => editorCommands.codeBlock(context))
          }
          onBold={() => run((context) => editorCommands.bold(context))}
          onItalic={() => run((context) => editorCommands.italic(context))}
          onStrike={() => run((context) => editorCommands.strike(context))}
          onInlineCode={() =>
            run((context) => editorCommands.inlineCode(context))
          }
          onUnderline={() =>
            run((context) => editorCommands.underline(context))
          }
          onHighlight={() =>
            run((context) => editorCommands.highlight(context))
          }
          onLink={handleLink}
          onSubscript={() =>
            run((context) => editorCommands.subscript(context))
          }
          onSuperscript={() =>
            run((context) => editorCommands.superscript(context))
          }
          onAlignLeft={() => handleAlign("left")}
          onAlignCenter={() => handleAlign("center")}
          onAlignRight={() => handleAlign("right")}
          onImage={handleImage}
          onMathChange={handleMathChange}
          onInsertEquals={() => insertMathShortcut(" = ")}
          onInsertSqrt={() => insertMathShortcut("sqrt()")}
          onInsertPow={() => insertMathShortcut("pow(,)")}
          onInsertPi={() => insertMathShortcut("pi")}
          onRenderMarkdown={handleRenderMarkdown}
          onCopyMarkdown={handleCopyMarkdown}
        />

        <div className="p-3 sm:p-3">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: um editor rich text obrigatoriamente precisa usar uma div com contentEditable. */}
          <div
            ref={editorRef}
            className={EDITOR_CONTENT_CLASSNAME}
            data-placeholder="Digite algum texto..."
            contentEditable
            suppressContentEditableWarning
            onInput={(event) => {
              handleInputTransform(event);
              syncToolbarState();
            }}
            onBeforeInput={handleEditorBeforeInput}
            onPaste={handlePaste}
            onKeyDown={handleEditorKeyDown}
            onMouseUp={() => {
              updateSavedRange();
              syncToolbarState();
            }}
            onKeyUp={() => {
              updateSavedRange();
              syncToolbarState();
            }}
            onFocus={() => {
              updateSavedRange();
              syncToolbarState();
            }}
            onBlur={() => {
              persistHtml();
              syncToolbarState();
            }}
          />

          <LinkDialog
            open={isLinkDialogOpen}
            onOpenChange={setIsLinkDialogOpen}
            linkUrl={linkUrl}
            onLinkUrlChange={setLinkUrl}
            openInNewTab={openLinkInNewTab}
            onOpenInNewTabChange={setOpenLinkInNewTab}
            onApplyLink={handleApplyLink}
            onRemoveLink={handleRemoveLink}
          />

          <ImageDialog
            open={isImageDialogOpen}
            onOpenChange={setIsImageDialogOpen}
            onInsertImage={handleInsertImage}
            onRemoveImage={handleRemoveImage}
          />
        </div>
      </div>
    </div>
  );
}
