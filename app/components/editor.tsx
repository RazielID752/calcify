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
import EditorToolbar from "./editor-toolbar";
import { useAutoTransforms } from "./hooks/use-auto-transforms";
import { useEditorSession } from "./hooks/use-editor-session";
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
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [openLinkInNewTab, setOpenLinkInNewTab] = useState(true);

  const [toolbarState, setToolbarState] = useState({
    bold: false,
    italic: false,
    strike: false,
    underline: false,
    highlight: false,
    subscript: false,
    superscript: false,
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

  useMarkdownRenderer({
    editorRef,
    onHtmlChange: applyExternalHtml,
    debounceMs: 500,
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

    const highlightValue = `${document.queryCommandValue("hiliteColor") ?? ""}`
      .trim()
      .toLowerCase();
    const hasHighlightCommandValue =
      highlightValue.length > 0 &&
      highlightValue !== "false" &&
      highlightValue !== "none" &&
      highlightValue !== "normal" &&
      highlightValue !== "unset" &&
      highlightValue !== "transparent" &&
      highlightValue !== "rgba(0, 0, 0, 0)" &&
      highlightValue !== "inherit" &&
      highlightValue !== "initial";

    const highlightElement = selectionElement?.closest("mark,span");
    const highlightBg = highlightElement
      ? window.getComputedStyle(highlightElement).backgroundColor.toLowerCase()
      : "";
    const hasHighlightAncestor =
      !!highlightElement &&
      highlightBg.length > 0 &&
      highlightBg !== "transparent" &&
      highlightBg !== "rgba(0, 0, 0, 0)";

    const isHighlighted = hasHighlightCommandValue || hasHighlightAncestor;

    setToolbarState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      strike: document.queryCommandState("strikeThrough"),
      underline: document.queryCommandState("underline"),
      highlight: isHighlighted,
      subscript: document.queryCommandState("subscript"),
      superscript: document.queryCommandState("superscript"),
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
      updateSavedRange();
      syncToolbarState();
    };

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [syncToolbarState, updateSavedRange]);

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
    updateSavedRange();
    setLinkUrl("https://");
    setOpenLinkInNewTab(true);
    setIsLinkDialogOpen(true);
  };

  const handleApplyLink = () => {
    const href = linkUrl.trim();

    if (!href) {
      return;
    }

    run((context) =>
      editorCommands.link(context, href, { openInNewTab: openLinkInNewTab }),
    );

    setIsLinkDialogOpen(false);
  };

  const handleRemoveLink = () => {
    run((context) => editorCommands.unlink(context));
    setIsLinkDialogOpen(false);
  };

  const handleImage = () => {
    updateSavedRange();
    setIsImageDialogOpen(true);
  };

  const handleInsertImage = (src: string) => {
    run((context) => editorCommands.image(context, src));
    setIsImageDialogOpen(false);
  };

  const handleRemoveImage = () => {
    run((context) => editorCommands.removeImage(context));
    setIsImageDialogOpen(false);
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

  const findCodeBlockFromSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);

    const getElementFromNode = (node: Node | null) => {
      if (!node) {
        return null;
      }

      return node.nodeType === Node.TEXT_NODE
        ? node.parentElement
        : (node as Element);
    };

    const candidates: Array<Node | null> = [
      range.startContainer,
      range.endContainer,
      selection.anchorNode,
      selection.focusNode,
      range.commonAncestorContainer,
    ];

    for (const candidate of candidates) {
      const element = getElementFromNode(candidate);
      const pre = element?.closest("pre");

      if (pre && editor.contains(pre)) {
        return pre;
      }
    }

    if (range.startContainer === editor) {
      const leftSibling = editor.childNodes[range.startOffset - 1];
      const rightSibling = editor.childNodes[range.startOffset];

      if (leftSibling instanceof HTMLElement && leftSibling.tagName === "PRE") {
        return leftSibling;
      }

      if (
        rightSibling instanceof HTMLElement &&
        rightSibling.tagName === "PRE"
      ) {
        return rightSibling;
      }
    }

    return null;
  };

  const findDeletableImageNodeFromSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);

    const getElementFromNode = (node: Node | null) => {
      if (!node) {
        return null;
      }

      return node.nodeType === Node.TEXT_NODE
        ? node.parentElement
        : (node as Element);
    };

    const isImageOnlyElement = (element: HTMLElement) => {
      const image = element.querySelector("img");

      if (!image) {
        return false;
      }

      const clone = element.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("img,br").forEach((node) => {
        node.remove();
      });

      const remainingText = clone.textContent?.replaceAll("\u00A0", " ").trim();

      return !remainingText;
    };

    const candidateNodes: Array<Node | null> = [
      range.startContainer,
      range.endContainer,
      selection.anchorNode,
      selection.focusNode,
      range.commonAncestorContainer,
    ];

    for (const candidateNode of candidateNodes) {
      const candidateElement = getElementFromNode(candidateNode);
      const closestImage = candidateElement?.closest("img");

      if (
        closestImage instanceof HTMLElement &&
        editor.contains(closestImage)
      ) {
        const imageBlock = closestImage.closest("p,div,li,blockquote");

        if (
          imageBlock instanceof HTMLElement &&
          editor.contains(imageBlock) &&
          isImageOnlyElement(imageBlock)
        ) {
          return imageBlock;
        }

        return closestImage;
      }

      const possibleBlock = candidateElement?.closest("p,div,li,blockquote");

      if (
        possibleBlock instanceof HTMLElement &&
        editor.contains(possibleBlock) &&
        isImageOnlyElement(possibleBlock)
      ) {
        return possibleBlock;
      }
    }

    if (range.startContainer === editor) {
      const siblings = [
        editor.childNodes[range.startOffset - 1],
        editor.childNodes[range.startOffset],
      ];

      for (const sibling of siblings) {
        if (sibling instanceof HTMLImageElement) {
          return sibling;
        }

        if (
          sibling instanceof HTMLElement &&
          editor.contains(sibling) &&
          isImageOnlyElement(sibling)
        ) {
          return sibling;
        }
      }
    }

    return null;
  };

  const insertLineBreakInsideCodeBlock = () => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const lineBreakNode = document.createTextNode("\n");

    range.deleteContents();
    range.insertNode(lineBreakNode);

    const caretRange = document.createRange();
    caretRange.setStartAfter(lineBreakNode);
    caretRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caretRange);

    updateSavedRange();
    persistHtml();
    syncToolbarState();
  };

  const handleEditorBeforeInput = (event: React.FormEvent<HTMLDivElement>) => {
    const nativeEvent = event.nativeEvent;

    if (!(nativeEvent instanceof InputEvent)) {
      return;
    }

    if (
      nativeEvent.inputType !== "insertParagraph" &&
      nativeEvent.inputType !== "insertLineBreak"
    ) {
      return;
    }

    const codeBlock = findCodeBlockFromSelection();

    if (!codeBlock) {
      return;
    }

    event.preventDefault();
    insertLineBreakInsideCodeBlock();
  };

  const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Backspace" || event.key === "Delete") {
      const editor = editorRef.current;
      const selection = window.getSelection();

      if (!editor || !selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);

      if (
        !selection.isCollapsed &&
        editor.contains(range.commonAncestorContainer)
      ) {
        const intersectedImages = [...editor.querySelectorAll("img")].filter(
          (image) => range.intersectsNode(image),
        );

        if (intersectedImages.length > 0) {
          event.preventDefault();
          run((context) => editorCommands.removeImage(context));
          return;
        }
      }

      if (selection.isCollapsed) {
        const deletableNode = findDeletableImageNodeFromSelection();

        if (deletableNode) {
          event.preventDefault();
          run((context) => editorCommands.removeImage(context));
          return;
        }
      }
    }

    if (event.key !== "Enter") {
      return;
    }

    const codeBlock = findCodeBlockFromSelection();

    if (!codeBlock) {
      return;
    }

    // Mantem a quebra de linha dentro do mesmo <pre> e evita split em dois blocos.
    event.preventDefault();
    insertLineBreakInsideCodeBlock();
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
            className="mx-auto min-h-[68vh] w-full max-w-7xl outline-none prose prose-zinc empty:before:content-[attr(data-placeholder)] empty:before:pointer-events-none empty:before:select-none empty:before:text-zinc-400 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300 [&_blockquote]:pl-4 [&_blockquote]:text-black [&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline [&_a]:decoration-blue-500 [&_a]:underline-offset-2 [&_a:hover]:text-blue-700 [&_a:visited]:text-indigo-600 [&_img]:my-3 [&_img]:max-h-[420px] [&_img]:max-w-full [&_img]:rounded-xl [&_img]:object-contain [&_code]:border [&_code]:border-zinc-300 [&_code]:bg-zinc-100 [&_code]:text-zinc-800 [&_code]:rounded-[6px] [&_code]:px-[0.2em] [&_code]:py-[0.1em] [&_code]:font-mono [&_code]:text-[0.875em] [&_code]:leading-[1.4] [&_h1]:mt-6 [&_h1]:text-4xl [&_h1]:font-bold [&_h2]:mt-5 [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-2xl [&_h3]:font-semibold [&_h4]:mt-4 [&_h4]:text-xl [&_h4]:font-semibold [&_p]:mt-5 [&_p]:text-base [&_p]:font-normal [&_p]:leading-[1.6] [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mt-6 [&_ul]:mb-6 [&_li]:my-1 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-zinc-950 [&_pre]:p-4 [&_pre]:text-zinc-100 [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:rounded-none [&_pre_code]:text-inherit [&_pre_code]:font-inherit"
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
