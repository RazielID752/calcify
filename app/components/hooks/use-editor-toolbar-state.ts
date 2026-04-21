"use client";

import { type RefObject, useCallback, useRef, useState } from "react";
import type { AlignType } from "../editor-commands";

export type EditorToolbarState = {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  underline: boolean;
  highlight: boolean;
  subscript: boolean;
  superscript: boolean;
  inlineCode: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  codeBlock: boolean;
  align: AlignType | null;
};

type UseEditorToolbarStateParams = {
  editorRef: RefObject<HTMLDivElement | null>;
};

const INITIAL_TOOLBAR_STATE: EditorToolbarState = {
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
  align: null,
};

export function useEditorToolbarState({
  editorRef,
}: UseEditorToolbarStateParams) {
  const [toolbarState, setToolbarState] = useState(INITIAL_TOOLBAR_STATE);
  const toolbarStateRef = useRef(INITIAL_TOOLBAR_STATE);

  const setToolbarStateIfChanged = useCallback(
    (nextState: EditorToolbarState) => {
      const previousState = toolbarStateRef.current;

      if (
        previousState.bold === nextState.bold &&
        previousState.italic === nextState.italic &&
        previousState.strike === nextState.strike &&
        previousState.underline === nextState.underline &&
        previousState.highlight === nextState.highlight &&
        previousState.subscript === nextState.subscript &&
        previousState.superscript === nextState.superscript &&
        previousState.inlineCode === nextState.inlineCode &&
        previousState.bulletList === nextState.bulletList &&
        previousState.orderedList === nextState.orderedList &&
        previousState.blockquote === nextState.blockquote &&
        previousState.codeBlock === nextState.codeBlock &&
        previousState.align === nextState.align
      ) {
        return;
      }

      toolbarStateRef.current = nextState;
      setToolbarState(nextState);
    },
    [],
  );

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

    setToolbarStateIfChanged({
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
  }, [editorRef, setToolbarStateIfChanged]);

  return {
    toolbarState,
    syncToolbarState,
  };
}
