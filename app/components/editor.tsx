"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type AlignType,
  editorCommands,
  type HeadingLevel,
  type ListType,
  mathOptions,
} from "./editor-commands";
import EditorToolbar from "./editor-toolbar";
import ZoomControls from "./zoom-controls";
import { useAutoTransforms } from "./hooks/use-auto-transforms";
import { useEditorSession } from "./hooks/use-editor-session";

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

  const [toolbarState, setToolbarState] = useState({
    bold: false,
    italic: false,
    strike: false,
    underline: false,
    subscript: false,
    inlineCode: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
    codeBlock: false,
    align: null as AlignType | null,
  });

  const { handleInputTransform } = useAutoTransforms({
    editorRef,
    savedRangeRef,
    moveCursorToEnd,
    persistHtml,
  });

  const syncToolbarState = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (!editor.contains(range.commonAncestorContainer)) {
      return;
    }

    const anchor = selection.anchorNode;
    const selectionElement = anchor
      ? anchor.nodeType === Node.TEXT_NODE
        ? anchor.parentElement
        : (anchor as Element)
      : null;
    const block = selectionElement?.closest(
      "p,div,h1,h2,h3,h4,blockquote,pre,li",
    );

    const align = document.queryCommandState("justifyCenter")
      ? "center"
      : document.queryCommandState("justifyRight")
        ? "right"
        : "left";

    setToolbarState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      strike: document.queryCommandState("strikeThrough"),
      underline: document.queryCommandState("underline"),
      subscript: document.queryCommandState("subscript"),
      inlineCode: Boolean(selectionElement?.closest("code")),
      bulletList: document.queryCommandState("insertUnorderedList"),
      orderedList: document.queryCommandState("insertOrderedList"),
      blockquote: block?.tagName === "BLOCKQUOTE",
      codeBlock: block?.tagName === "PRE",
      align,
    });
  }, [editorRef]);

  useEffect(() => {
    const handleSelectionChange = () => {
      syncToolbarState();
    };

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [syncToolbarState]);

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

  const handleLink = () => {
    const href = window.prompt("Digite a URL do link:", "https://");

    if (!href) {
      return;
    }

    run((context) => editorCommands.link(context, href));
  };

  const handleImage = () => {
    const src = window.prompt("Digite a URL da imagem:", "https://");

    if (!src) {
      return;
    }

    run((context) => editorCommands.image(context, src));
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

  const handleRenderMarkdown = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const currentMarkdown = editorCommands.htmlToMarkdown(editor.innerHTML);
    const inputMarkdown = window.prompt(
      "Cole o markdown para renderizar no editor:",
      currentMarkdown,
    );

    if (inputMarkdown === null) {
      return;
    }

    const rendered = editorCommands.markdownToHtml(inputMarkdown);
    applyExternalHtml(rendered);
    syncToolbarState();
  };

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

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const htmlData = e.clipboardData.getData("text/html");
    const textData = e.clipboardData.getData("text/plain");

    if (!htmlData && textData) {
      e.preventDefault();
      const renderedHtml = editorCommands.markdownToHtml(textData);
      document.execCommand("insertHTML", false, renderedHtml);
      persistHtml();
      syncToolbarState();
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
      className="relative min-h-screen bg-[radial-gradient(circle_at_top,_#e7f7ef_0%,_#f8fafc_45%,_#ffffff_100%)] px-3 py-6 sm:px-6 sm:py-8"
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
          <p className="text-sm text-zinc-600">
            Use markdown, formatação rica e expressões como `20 + 15 =` para
            calcular automaticamente.
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
            className="mx-auto min-h-[68vh] w-full max-w-7xl outline-none prose prose-zinc empty:before:content-[attr(data-placeholder)] empty:before:pointer-events-none empty:before:select-none empty:before:text-zinc-400 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-600 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-zinc-950 [&_pre]:p-4 [&_pre]:text-zinc-100"
            data-placeholder="Digite algum texto..."
            contentEditable
            suppressContentEditableWarning
            onInput={(event) => {
              handleInputTransform(event);
              syncToolbarState();
            }}
            onPaste={handlePaste}
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
          />
        </div>
      </div>
    </div>
  );
}
