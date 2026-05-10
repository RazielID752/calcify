"use client";

import DOMPurify from "dompurify";
import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
  useCallback,
} from "react";
import { editorCommands } from "../editor-commands";

type EditorAction = (context: {
  editor: HTMLDivElement;
  savedRange: Range | null;
}) => void;

type UseEditorContentHandlersParams = {
  editorRef: RefObject<HTMLDivElement | null>;
  persistHtml: () => void;
  updateSavedRange: () => void;
  syncToolbarState: () => void;
  run: (action: EditorAction) => void;
};

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

const getSelectionBlockElement = (editor: HTMLDivElement) => {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const candidateNodes: Array<Node | null> = [
    range.startContainer,
    range.endContainer,
    selection.anchorNode,
    selection.focusNode,
    range.commonAncestorContainer,
  ];

  for (const candidateNode of candidateNodes) {
    const candidateElement = getElementFromNode(candidateNode);
    const block = candidateElement?.closest(
      "p,div,h1,h2,h3,h4,blockquote,pre,li",
    );

    if (block instanceof HTMLElement && editor.contains(block)) {
      return block;
    }
  }

  return null;
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

export function useEditorContentHandlers({
  editorRef,
  persistHtml,
  updateSavedRange,
  syncToolbarState,
  run,
}: UseEditorContentHandlersParams) {
  const findCodeBlockFromSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);

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
  }, [editorRef]);

  const findDeletableImageNodeFromSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);

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
  }, [editorRef]);

  const insertLineBreakInsideCodeBlock = useCallback(() => {
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
  }, [persistHtml, syncToolbarState, updateSavedRange]);

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      const htmlData = event.clipboardData.getData("text/html");
      const textData = event.clipboardData.getData("text/plain");

      if (htmlData) {
        event.preventDefault();
        const sanitizedHtml = DOMPurify.sanitize(htmlData);
        document.execCommand("insertHTML", false, sanitizedHtml);
        persistHtml();
        syncToolbarState();
        updateSavedRange();
        return;
      }

      if (textData) {
        event.preventDefault();
        const renderedHtml = editorCommands.markdownToHtml(textData);
        document.execCommand("insertHTML", false, renderedHtml);
        persistHtml();
        syncToolbarState();
        updateSavedRange();
      }
    },
    [persistHtml, syncToolbarState, updateSavedRange],
  );

  const continueFromCalculatedResult = useCallback(
    (insertedText: string) => {
      const editor = editorRef.current;
      const selection = window.getSelection();

      if (!editor || !selection || selection.rangeCount === 0) {
        return false;
      }

      const block = getSelectionBlockElement(editor);

      if (!block) {
        return false;
      }

      const resultNode = block.querySelector("[data-calc-result='true']");

      if (!(resultNode instanceof HTMLElement)) {
        return false;
      }

      const range = selection.getRangeAt(0);
      const atEndOfBlock =
        range.collapsed &&
        range.endContainer === block &&
        range.endOffset === block.childNodes.length;

      if (!atEndOfBlock) {
        return false;
      }

      const resultText = resultNode.textContent?.trim();

      if (!resultText) {
        return false;
      }

      block.textContent = `${resultText}${insertedText}`;
      moveCaretToEnd(block);
      persistHtml();
      syncToolbarState();
      updateSavedRange();
      return true;
    },
    [editorRef, persistHtml, syncToolbarState, updateSavedRange],
  );

  const exitBlockquote = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return false;
    }

    const block = getSelectionBlockElement(editor);

    if (block?.tagName !== "BLOCKQUOTE") {
      return false;
    }

    const paragraph = document.createElement("p");
    paragraph.innerHTML = "<br>";
    block.insertAdjacentElement("afterend", paragraph);
    moveCaretToEnd(paragraph);
    persistHtml();
    syncToolbarState();
    updateSavedRange();
    return true;
  }, [editorRef, persistHtml, syncToolbarState, updateSavedRange]);

  const insertTabCharacters = useCallback(() => {
    document.execCommand("insertText", false, "    ");
    persistHtml();
    syncToolbarState();
    updateSavedRange();
  }, [persistHtml, syncToolbarState, updateSavedRange]);

  const handleEditorBeforeInput = useCallback(
    (event: FormEvent<HTMLDivElement>) => {
      const nativeEvent = event.nativeEvent;

      if (!(nativeEvent instanceof InputEvent)) {
        return;
      }

      if (
        nativeEvent.inputType === "insertText" &&
        typeof nativeEvent.data === "string" &&
        nativeEvent.data.length > 0 &&
        continueFromCalculatedResult(nativeEvent.data)
      ) {
        event.preventDefault();
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
    },
    [
      continueFromCalculatedResult,
      findCodeBlockFromSelection,
      insertLineBreakInsideCodeBlock,
    ],
  );

  const handleEditorKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Tab") {
        event.preventDefault();
        insertTabCharacters();
        return;
      }

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

      if (!event.shiftKey && exitBlockquote()) {
        event.preventDefault();
        return;
      }

      const codeBlock = findCodeBlockFromSelection();

      if (!codeBlock) {
        return;
      }

      event.preventDefault();
      insertLineBreakInsideCodeBlock();
    },
    [
      editorRef,
      exitBlockquote,
      findCodeBlockFromSelection,
      findDeletableImageNodeFromSelection,
      insertTabCharacters,
      insertLineBreakInsideCodeBlock,
      run,
    ],
  );

  return {
    handlePaste,
    handleEditorBeforeInput,
    handleEditorKeyDown,
  };
}
