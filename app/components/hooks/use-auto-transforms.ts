"use client";

import { useRef } from "react";
import { calculateLines } from "@/utils/calculate";
import {
  convertCurrency,
  formatCurrencyConversion,
  parseConvertCommand,
  renderCurrencyConversionLineHtml,
} from "@/utils/currency-conversion";
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

const isFormattingInput = (event: React.FormEvent<HTMLDivElement>) => {
  const nativeEvent = event.nativeEvent;

  if (!(nativeEvent instanceof InputEvent)) {
    return false;
  }

  return nativeEvent.inputType.startsWith("format");
};

const normalizeBlockText = (value: string) =>
  value.replaceAll("\u00A0", " ").replace(/\s+/g, " ").trim();

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
  const currencyConversionRequestIdRef = useRef(0);

  const normalizeParagraphDivOnActiveBlock = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return false;
    }

    const anchorNode = selection.anchorNode;

    if (!anchorNode) {
      return false;
    }

    const anchorElement =
      anchorNode.nodeType === Node.TEXT_NODE
        ? anchorNode.parentElement
        : (anchorNode as Element);

    if (!anchorElement) {
      return false;
    }

    const block = anchorElement.closest("p,div,h1,h2,h3,h4,blockquote,pre,li");

    if (!(block instanceof HTMLElement) || block.tagName !== "DIV") {
      return false;
    }

    if (block.parentElement !== editor) {
      return false;
    }

    if (block.closest("blockquote,li,pre")) {
      return false;
    }

    const hasNestedBlockChildren = [...block.children].some((child) =>
      [
        "P",
        "DIV",
        "H1",
        "H2",
        "H3",
        "H4",
        "UL",
        "OL",
        "LI",
        "BLOCKQUOTE",
        "PRE",
        "TABLE",
      ].includes(child.tagName),
    );

    if (hasNestedBlockChildren) {
      return false;
    }

    if (block.querySelector("img,video,audio,iframe,table")) {
      return false;
    }

    const paragraph = document.createElement("p");
    paragraph.innerHTML = block.innerHTML || "<br>";
    block.replaceWith(paragraph);
    moveCursorToEnd(paragraph);

    return true;
  };

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
        const heading = document.createElement("h1");
        editor.insertBefore(heading, anchorNode);
        heading.appendChild(anchorNode);
        return heading;
      }

      if (anchorElement === editor) {
        const hasAnyChild = editor.childNodes.length > 0;

        // Evita criar um bloco extra quando já existe conteúdo no editor.
        if (hasAnyChild) {
          return null;
        }

        const heading = document.createElement("h1");
        heading.innerHTML = "<br>";
        editor.appendChild(heading);
        moveCursorToEnd(heading);
        return heading;
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

  const applyAutoCalculationOnActiveBlock = (
    event: React.FormEvent<HTMLDivElement>,
  ) => {
    if (isApplyingAutoCalcRef.current) {
      return false;
    }

    if (isLineBreakInput(event)) {
      return false;
    }

    const block = getActiveBlock();

    if (!block) {
      return false;
    }

    if (block.querySelector('[data-calc-result="true"]')) {
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

  const applyAutoCurrencyConversionOnActiveBlock = (
    event: React.FormEvent<HTMLDivElement>,
  ) => {
    if (isLineBreakInput(event)) {
      return false;
    }

    const block = getActiveBlock();

    if (!block || !["P", "DIV"].includes(block.tagName)) {
      return false;
    }

    const rawLine = normalizeBlockText(block.textContent ?? block.innerText);
    const command = parseConvertCommand(rawLine);

    if (!command) {
      return false;
    }

    const requestId = ++currencyConversionRequestIdRef.current;
    const sourceLineSnapshot = rawLine;

    persistHtml();

    void (async () => {
      try {
        const convertedAmount = await convertCurrency(
          command.amount,
          command.from,
          command.to,
        );

        if (requestId !== currencyConversionRequestIdRef.current) {
          return;
        }

        const currentLine = block.innerText.replaceAll("\u00A0", " ").trim();

        if (normalizeBlockText(currentLine) !== sourceLineSnapshot) {
          return;
        }

        const convertedLine = formatCurrencyConversion(
          command,
          convertedAmount,
        );

        block.innerHTML = renderCurrencyConversionLineHtml(convertedLine);
        block.dataset.currencyConversion = "true";
        block.dataset.currencyConversionFrom = command.from;
        block.dataset.currencyConversionTo = command.to;
        block.dataset.currencyConversionAmount = String(command.amount);
        moveCursorToEnd(block);
        persistHtml();
      } catch (error) {
        console.warn("Falha ao converter moeda automaticamente:", error);
      }
    })();

    return true;
  };

  const removeInheritedCalculationStyleOnActiveBlock = () => {
    const block = getActiveBlock();

    if (!block) {
      return false;
    }

    const rawLine = block.innerText.replaceAll("\u00A0", " ").trim();
    const normalizedLine = normalizeBlockText(rawLine);
    const hasTriggerLine =
      normalizedLine.includes("=") && /[+\-*/^%]/.test(normalizedLine);

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
    delete block.dataset.currencyConversion;
    delete block.dataset.currencyConversionFrom;
    delete block.dataset.currencyConversionTo;
    delete block.dataset.currencyConversionAmount;
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
    normalizeParagraphDivOnActiveBlock();

    const hasMarkdownTransform = applyAutoMarkdownOnActiveBlock(event);

    if (hasMarkdownTransform) {
      return;
    }

    const hasTypographicTransform =
      applyTypographicConversionOnActiveBlock(event);

    if (hasTypographicTransform) {
      return;
    }

    if (isFormattingInput(event)) {
      persistHtml();
      return;
    }

    const hasInheritedCalcStyle =
      removeInheritedCalculationStyleOnActiveBlock();

    if (hasInheritedCalcStyle) {
      return;
    }

    const hasCalculationTransform = applyAutoCalculationOnActiveBlock(event);

    if (hasCalculationTransform) {
      return;
    }

    const hasCurrencyConversionTransform =
      applyAutoCurrencyConversionOnActiveBlock(event);

    if (hasCurrencyConversionTransform) {
      return;
    }

    persistHtml();
  };

  return {
    handleInputTransform,
  };
}
