"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
  useCallback,
} from "react";
import { editorCommands } from "../editor-commands";
import {
  getElementFromNode,
  getSelectionBlockElement,
  isCaretAtEndOfBlock,
  isImageOnlyElement,
  moveCaretToEnd,
} from "./editor-content-utils";

type EditorAction = (context: {
  editor: HTMLDivElement;
  savedRange: Range | null;
}) => void;

type UseEditorKeyHandlersParams = {
  editorRef: RefObject<HTMLDivElement | null>;
  onRedo: () => void;
  onUndo: () => void;
  persistHtml: () => void;
  updateSavedRange: () => void;
  syncToolbarState: () => void;
  run: (action: EditorAction) => void;
};

export function useEditorKeyHandlers({
  editorRef,
  onRedo,
  onUndo,
  persistHtml,
  updateSavedRange,
  syncToolbarState,
  run,
}: UseEditorKeyHandlersParams) {
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

      if (!isCaretAtEndOfBlock(block)) {
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

  const insertParagraphAfterCalculatedResult = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return false;
    }

    const block = getSelectionBlockElement(editor);

    if (!block || !block.querySelector("[data-calc-result='true']")) {
      return false;
    }

    if (!isCaretAtEndOfBlock(block)) {
      return false;
    }

    const nextBlock =
      block.tagName === "LI"
        ? document.createElement("li")
        : document.createElement("p");

    nextBlock.innerHTML = "<br>";
    block.insertAdjacentElement("afterend", nextBlock);
    moveCaretToEnd(nextBlock);
    persistHtml();
    syncToolbarState();
    updateSavedRange();

    return true;
  }, [editorRef, persistHtml, syncToolbarState, updateSavedRange]);

  const insertParagraphAfterTerminalTable = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const cell = getElementFromNode(range.startContainer)?.closest("td,th");

    if (
      !(cell instanceof HTMLTableCellElement) ||
      !selection.isCollapsed ||
      !editor.contains(cell) ||
      !isCaretAtEndOfBlock(cell)
    ) {
      return false;
    }

    const table = cell.closest("table");

    if (!(table instanceof HTMLTableElement) || !editor.contains(table)) {
      return false;
    }

    const cells = [...table.querySelectorAll("th,td")];
    const isLastCell = cells.at(-1) === cell;

    if (!isLastCell) {
      return false;
    }

    const nextElement = table.nextElementSibling;
    const paragraph =
      nextElement instanceof HTMLParagraphElement
        ? nextElement
        : document.createElement("p");

    if (!paragraph.isConnected) {
      paragraph.innerHTML = "<br>";
      table.insertAdjacentElement("afterend", paragraph);
    }

    moveCaretToEnd(paragraph);
    persistHtml();
    syncToolbarState();
    updateSavedRange();
    return true;
  }, [editorRef, persistHtml, syncToolbarState, updateSavedRange]);

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
      const pressedShortcutModifier = event.metaKey || event.ctrlKey;
      const pressedKey = event.key.toLowerCase();

      if (pressedShortcutModifier && pressedKey === "z") {
        event.preventDefault();

        if (event.shiftKey) {
          onRedo();
          return;
        }

        onUndo();
        return;
      }

      if (pressedShortcutModifier && pressedKey === "y") {
        event.preventDefault();
        onRedo();
        return;
      }

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

      if (!event.shiftKey && insertParagraphAfterCalculatedResult()) {
        event.preventDefault();
        return;
      }

      if (!event.shiftKey && exitBlockquote()) {
        event.preventDefault();
        return;
      }

      if (!event.shiftKey && insertParagraphAfterTerminalTable()) {
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
      insertParagraphAfterCalculatedResult,
      insertParagraphAfterTerminalTable,
      onRedo,
      onUndo,
      run,
    ],
  );

  return {
    handleEditorBeforeInput,
    handleEditorKeyDown,
  };
}
