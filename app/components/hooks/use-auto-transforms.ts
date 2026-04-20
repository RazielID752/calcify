"use client";

import { useRef } from "react";
import { calculateLines } from "@/utils/calculate";
import {
  type EditorContext,
  editorCommands,
  type HeadingLevel,
  type ListType,
} from "../editor-commands";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderCalculatedLineHtml = (line: string) => {
  const separator = " = ";
  const separatorIndex = line.lastIndexOf(separator);

  if (separatorIndex === -1) {
    return escapeHtml(line);
  }

  const prefix = line.slice(0, separatorIndex + separator.length);
  const result = line.slice(separatorIndex + separator.length);

  return `${escapeHtml(prefix)}<span data-calc-result="true" class="font-semibold text-emerald-600">${escapeHtml(result)}</span>`;
};

const isMarkdownTriggerInput = (event: React.FormEvent<HTMLDivElement>) => {
  const nativeEvent = event.nativeEvent;

  if (!(nativeEvent instanceof InputEvent)) {
    return false;
  }

  return (
    nativeEvent.inputType === "insertText" ||
    nativeEvent.inputType === "insertLineBreak" ||
    nativeEvent.inputType === "insertParagraph"
  );
};

const isSpaceInsertInput = (event: React.FormEvent<HTMLDivElement>) => {
  const nativeEvent = event.nativeEvent;

  if (!(nativeEvent instanceof InputEvent)) {
    return false;
  }

  return nativeEvent.inputType === "insertText" && nativeEvent.data === " ";
};

const isLineBreakInput = (event: React.FormEvent<HTMLDivElement>) => {
  const nativeEvent = event.nativeEvent;

  if (!(nativeEvent instanceof InputEvent)) {
    return false;
  }

  return (
    nativeEvent.inputType === "insertLineBreak" ||
    nativeEvent.inputType === "insertParagraph"
  );
};

const isTypographicTriggerInput = (event: React.FormEvent<HTMLDivElement>) => {
  const nativeEvent = event.nativeEvent;

  if (!(nativeEvent instanceof InputEvent)) {
    return false;
  }

  return nativeEvent.inputType === "insertText" && nativeEvent.data === ">";
};

type UseAutoTransformsParams = {
  editorRef: React.RefObject<HTMLDivElement | null>;
  savedRangeRef: React.RefObject<Range | null>;
  moveCursorToEnd: (element: HTMLElement) => void;
  persistHtml: () => void;
};

export function useAutoTransforms({
  editorRef,
  savedRangeRef,
  moveCursorToEnd,
  persistHtml,
}: UseAutoTransformsParams) {
  const isApplyingAutoCalcRef = useRef(false);
  const isApplyingAutoMarkdownRef = useRef(false);

  const getActiveBlock = () => {
    const editor = editorRef.current;

    if (!editor) {
      return null;
    }

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    const anchorNode = selection.anchorNode;

    if (!anchorNode) {
      return null;
    }

    const anchorElement =
      anchorNode.nodeType === Node.TEXT_NODE
        ? anchorNode.parentElement
        : (anchorNode as Element);

    if (!anchorElement) {
      return null;
    }

    const block = anchorElement.closest("p,div,h1,h2,h3,h4,blockquote,pre,li");

    if (!block || block === editor || !editor.contains(block)) {
      if (
        anchorNode.nodeType === Node.TEXT_NODE &&
        anchorNode.parentNode === editor
      ) {
        const paragraph = document.createElement("p");
        editor.insertBefore(paragraph, anchorNode);
        paragraph.appendChild(anchorNode);
        return paragraph;
      }

      if (anchorElement === editor) {
        const paragraph = document.createElement("p");
        paragraph.innerHTML = "<br>";
        editor.appendChild(paragraph);
        moveCursorToEnd(paragraph);
        return paragraph;
      }

      return null;
    }

    return block as HTMLElement;
  };

  const getCommandContext = (): EditorContext | null => {
    const editor = editorRef.current;

    if (!editor) {
      return null;
    }

    const selection = window.getSelection();
    const liveRange =
      selection && selection.rangeCount > 0
        ? selection.getRangeAt(0).cloneRange()
        : savedRangeRef.current;

    return {
      editor,
      savedRange: liveRange,
    };
  };

  const runListFromMarkdown = (
    type: ListType,
    block: HTMLElement,
    content: string,
  ) => {
    block.textContent = content;
    moveCursorToEnd(block);

    const context = getCommandContext();

    if (!context) {
      return false;
    }

    editorCommands.list(context, type);

    persistHtml();
    return true;
  };

  const runBlockFormatFromMarkdown = (
    block: HTMLElement,
    format: "blockquote" | HeadingLevel,
    content: string,
  ) => {
    block.textContent = content;
    moveCursorToEnd(block);

    const context = getCommandContext();

    if (!context) {
      return false;
    }

    if (format === "blockquote") {
      editorCommands.blockquote(context);
    } else {
      editorCommands.heading(context, format);
    }

    persistHtml();
    return true;
  };

  const applyAutoMarkdownOnActiveBlock = (
    event: React.FormEvent<HTMLDivElement>,
  ) => {
    if (isApplyingAutoMarkdownRef.current || !isMarkdownTriggerInput(event)) {
      return false;
    }

    let block = getActiveBlock();

    // Ao pressionar Enter, o browser pode mover o cursor para um novo paragrafo vazio.
    // Nesse caso, tentamos aplicar a transformacao no bloco anterior que contem o markdown.
    if (block && isLineBreakInput(event) && block.innerText.trim() === "") {
      const previousBlock = block.previousElementSibling;

      if (
        previousBlock instanceof HTMLElement &&
        ["P", "DIV"].includes(previousBlock.tagName)
      ) {
        block = previousBlock;
      }
    }

    if (!block || !["P", "DIV"].includes(block.tagName)) {
      return false;
    }

    const rawLine = block.innerText.replaceAll("\u00A0", " ");

    // Heading estilo Notion: converte em "## " e mantém quando vira "## Título"
    const headingEmptyMatch = rawLine.match(/^\s{0,3}(#{1,4})\s$/);
    if (headingEmptyMatch?.[1] && isSpaceInsertInput(event)) {
      isApplyingAutoMarkdownRef.current = true;
      const level =
        `h${Math.min(4, headingEmptyMatch[1].length)}` as HeadingLevel;
      const converted = runBlockFormatFromMarkdown(block, level, "");

      window.setTimeout(() => {
        isApplyingAutoMarkdownRef.current = false;
      }, 0);

      return converted;
    }

    const headingMatch = rawLine.match(/^\s{0,3}(#{1,4})\s+(.+?)$/);
    if (headingMatch?.[1]) {
      isApplyingAutoMarkdownRef.current = true;
      const level = `h${Math.min(4, headingMatch[1].length)}` as HeadingLevel;
      const title = headingMatch[2].trim();

      const converted = runBlockFormatFromMarkdown(block, level, title);

      window.setTimeout(() => {
        isApplyingAutoMarkdownRef.current = false;
      }, 0);

      return converted;
    }

    // Blockquote: "> Citação"
    const quoteMatch = rawLine.match(/^\s{0,3}>\s+(.+?)$/);
    if (quoteMatch) {
      isApplyingAutoMarkdownRef.current = true;
      const quoteText = quoteMatch[1].trim();
      const converted = runBlockFormatFromMarkdown(
        block,
        "blockquote",
        quoteText,
      );

      window.setTimeout(() => {
        isApplyingAutoMarkdownRef.current = false;
      }, 0);

      return converted;
    }

    // Unordered list: "- Item" ou "* Item"
    const ulEmptyMatch = rawLine.match(/^\s{0,3}[-*]\s$/);
    if (ulEmptyMatch && isSpaceInsertInput(event)) {
      isApplyingAutoMarkdownRef.current = true;
      const converted = runListFromMarkdown("bullet", block, "");

      window.setTimeout(() => {
        isApplyingAutoMarkdownRef.current = false;
      }, 0);

      return converted;
    }

    const ulMatch = rawLine.match(/^\s{0,3}[-*]\s+(.+?)$/);
    if (ulMatch && isLineBreakInput(event)) {
      isApplyingAutoMarkdownRef.current = true;
      const itemText = ulMatch[1].trim();
      const converted = runListFromMarkdown("bullet", block, itemText);

      window.setTimeout(() => {
        isApplyingAutoMarkdownRef.current = false;
      }, 0);

      return converted;
    }

    // Ordered list: "1. Item"
    const olEmptyMatch = rawLine.match(/^\s{0,3}1\.\s$/);
    if (olEmptyMatch && isSpaceInsertInput(event)) {
      isApplyingAutoMarkdownRef.current = true;
      const converted = runListFromMarkdown("ordered", block, "");

      window.setTimeout(() => {
        isApplyingAutoMarkdownRef.current = false;
      }, 0);

      return converted;
    }

    const olMatch = rawLine.match(/^\s{0,3}\d+\.\s+(.+?)$/);
    if (olMatch && isLineBreakInput(event)) {
      isApplyingAutoMarkdownRef.current = true;
      const itemText = olMatch[1].trim();
      const converted = runListFromMarkdown("ordered", block, itemText);

      window.setTimeout(() => {
        isApplyingAutoMarkdownRef.current = false;
      }, 0);

      return converted;
    }

    return false;
  };

  const applyAutoCalculationOnActiveBlock = () => {
    if (isApplyingAutoCalcRef.current) {
      return false;
    }

    const block = getActiveBlock();

    if (!block) {
      return false;
    }

    const rawLine = block.innerText.replaceAll("\u00A0", " ").trim();
    const hasTriggerLine = rawLine.includes("=") && /[+\-*/^%]/.test(rawLine);

    if (!hasTriggerLine) {
      return false;
    }

    const calculatedLine = calculateLines(rawLine)[0] ?? rawLine;

    if (calculatedLine === rawLine) {
      return false;
    }

    isApplyingAutoCalcRef.current = true;
    block.innerHTML = renderCalculatedLineHtml(calculatedLine);
    moveCursorToEnd(block);
    persistHtml();

    window.setTimeout(() => {
      isApplyingAutoCalcRef.current = false;
    }, 0);

    return true;
  };

  const removeInheritedCalculationStyleOnActiveBlock = () => {
    const block = getActiveBlock();

    if (!block) {
      return false;
    }

    const rawLine = block.innerText.replaceAll("\u00A0", " ").trim();
    const hasTriggerLine = rawLine.includes("=") && /[+\-*/^%]/.test(rawLine);

    if (hasTriggerLine) {
      return false;
    }

    const hasCalcDecoration = Boolean(
      block.querySelector('[data-calc-result="true"], span.text-emerald-600'),
    );

    if (!hasCalcDecoration) {
      return false;
    }

    const plainText = block.innerText.replaceAll("\u00A0", " ");
    block.textContent = plainText;
    moveCursorToEnd(block);
    persistHtml();

    return true;
  };

  const applyTypographicConversionOnActiveBlock = (
    event: React.FormEvent<HTMLDivElement>,
  ) => {
    if (!isTypographicTriggerInput(event)) {
      return false;
    }

    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return false;
    }

    if (!selection.isCollapsed) {
      return false;
    }

    const anchorNode = selection.anchorNode;

    if (!(anchorNode instanceof Text)) {
      return false;
    }

    const anchorElement = anchorNode.parentElement;

    if (!anchorElement) {
      return false;
    }

    if (anchorElement.closest("code,pre")) {
      return false;
    }

    const anchorOffset = selection.anchorOffset;

    if (anchorOffset < 2) {
      return false;
    }

    const pair = anchorNode.data.slice(anchorOffset - 2, anchorOffset);

    if (pair !== "->") {
      return false;
    }

    anchorNode.deleteData(anchorOffset - 2, 2);
    anchorNode.insertData(anchorOffset - 2, "→");

    const range = document.createRange();
    range.setStart(anchorNode, anchorOffset - 1);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    persistHtml();
    return true;
  };

  const handleInputTransform = (event: React.FormEvent<HTMLDivElement>) => {
    const hasMarkdownTransform = applyAutoMarkdownOnActiveBlock(event);

    if (hasMarkdownTransform) {
      return;
    }

    const hasTypographicTransform =
      applyTypographicConversionOnActiveBlock(event);

    if (hasTypographicTransform) {
      return;
    }

    const hasInheritedCalcStyle =
      removeInheritedCalculationStyleOnActiveBlock();

    if (hasInheritedCalcStyle) {
      return;
    }

    const hasCalculationTransform = applyAutoCalculationOnActiveBlock();

    if (hasCalculationTransform) {
      return;
    }

    persistHtml();
  };

  return {
    handleInputTransform,
  };
}
