"use client";

import DOMPurify from "dompurify";
import { type ClipboardEvent, useCallback } from "react";
import { editorCommands } from "../editor-commands";

const BLOCK_ELEMENT_SELECTOR =
  "p,ul,ol,blockquote,pre,table,hr,div,h1,h2,h3,h4,h5,h6";

const normalizePastedHtml = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  for (const meta of [...doc.querySelectorAll("meta")]) {
    meta.remove();
  }

  for (const element of [...doc.querySelectorAll("*")]) {
    for (const attribute of [...element.attributes]) {
      if (attribute.name.startsWith("data-")) {
        element.removeAttribute(attribute.name);
      }

      if (["style", "class", "id", "dir"].includes(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    }
  }

  for (const strongLike of [...doc.querySelectorAll("b")]) {
    const fontWeight = strongLike.style.fontWeight?.toLowerCase() ?? "";

    if (fontWeight === "normal" || fontWeight === "400") {
      strongLike.replaceWith(...strongLike.childNodes);
    }
  }

  for (const span of [...doc.querySelectorAll("span")]) {
    span.replaceWith(...span.childNodes);
  }

  for (const br of [...doc.querySelectorAll("br")]) {
    const parent = br.parentElement;

    if (!parent || parent === doc.body) {
      br.remove();
      continue;
    }

    if (["B", "P"].includes(parent.tagName) && parent.childNodes.length === 1) {
      br.remove();
    }
  }

  for (const span of [...doc.querySelectorAll("span")]) {
    if (span.querySelector(BLOCK_ELEMENT_SELECTOR)) {
      span.replaceWith(...span.childNodes);
    }
  }

  for (const heading of [...doc.querySelectorAll("h1,h2,h3,h4,h5,h6")]) {
    const blocks = [...heading.querySelectorAll(BLOCK_ELEMENT_SELECTOR)].filter(
      (block) => block !== heading,
    );

    if (blocks.length === 0) {
      continue;
    }

    let insertAfter: Element = heading;

    for (const block of blocks) {
      insertAfter.after(block);
      insertAfter = block;
    }
  }

  for (const paragraph of [...doc.querySelectorAll("p")]) {
    const nestedParagraphs = paragraph.querySelectorAll("p");

    if (nestedParagraphs.length === 0) {
      continue;
    }

    for (const nested of [...nestedParagraphs]) {
      nested.replaceWith(...nested.childNodes);
    }
  }

  for (const paragraph of [...doc.querySelectorAll("p")]) {
    if (paragraph.textContent?.replace(/\u00A0/g, " ").trim()) {
      continue;
    }

    if (paragraph.querySelector("img,video,audio,iframe,table")) {
      continue;
    }

    paragraph.remove();
  }

  for (const listItem of [...doc.querySelectorAll("li")]) {
    const childParagraphs = [...listItem.children].filter(
      (child) => child.tagName === "P",
    ) as HTMLParagraphElement[];

    if (childParagraphs.length === 0) {
      continue;
    }

    for (const paragraph of childParagraphs) {
      listItem.insertBefore(
        document.createTextNode(" "),
        paragraph.nextSibling,
      );
      paragraph.replaceWith(...paragraph.childNodes);
    }
  }

  return doc.body.innerHTML;
};

type UseEditorPasteHandlersParams = {
  persistHtml: () => void;
  updateSavedRange: () => void;
  syncToolbarState: () => void;
};

export function useEditorPasteHandlers({
  persistHtml,
  updateSavedRange,
  syncToolbarState,
}: UseEditorPasteHandlersParams) {
  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      const htmlData = event.clipboardData.getData("text/html");
      const textData = event.clipboardData.getData("text/plain");

      if (htmlData) {
        event.preventDefault();
        const sanitizedHtml = DOMPurify.sanitize(htmlData);
        const normalizedHtml = normalizePastedHtml(sanitizedHtml);
        document.execCommand("insertHTML", false, normalizedHtml);
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

  return {
    handlePaste,
  };
}
