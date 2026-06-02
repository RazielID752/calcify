import { type RefObject, useCallback, useState } from "react";
import {
  EMPTY_EDITOR_HTML,
  hasMeaningfulEditorContent,
} from "../editor-document";

type UseEditorEmptyStateOptions = {
  editorRef: RefObject<HTMLDivElement | null>;
  moveCursorToEnd: (element: HTMLElement) => void;
};

const getElementText = (element: HTMLElement | null) =>
  element?.textContent?.replaceAll("\u00A0", " ").trim() ?? "";

const getBodyElements = (
  rootChildren: HTMLElement[],
  titleElement: HTMLElement | null,
) => (titleElement ? rootChildren.slice(1) : rootChildren);

export const useEditorEmptyState = ({
  editorRef,
  moveCursorToEnd,
}: UseEditorEmptyStateOptions) => {
  const [isTitleEmpty, setIsTitleEmpty] = useState(true);
  const [isBodyEmpty, setIsBodyEmpty] = useState(true);

  const ensureEditorScaffoldWhenEmpty = useCallback(
    (options?: { moveCaretTo?: "title" | "body" }) => {
      const editor = editorRef.current;

      if (!editor) {
        return false;
      }

      const html = editor.innerHTML;
      const isEmpty = !hasMeaningfulEditorContent(html);

      if (!isEmpty) {
        return false;
      }

      const firstElement = editor.firstElementChild;
      const firstElementIsTitle =
        firstElement instanceof HTMLHeadingElement &&
        firstElement.tagName === "H1";
      const secondElement = editor.children[1];
      const secondElementIsBody =
        secondElement instanceof HTMLElement &&
        ["P", "DIV"].includes(secondElement.tagName);

      if (!firstElementIsTitle || !secondElementIsBody) {
        editor.innerHTML = EMPTY_EDITOR_HTML;
      }

      const titleElement = editor.querySelector("h1");
      const bodyElement = editor.querySelector("p,div");

      if (
        options?.moveCaretTo === "title" &&
        titleElement instanceof HTMLElement
      ) {
        moveCursorToEnd(titleElement);
      }

      if (
        options?.moveCaretTo === "body" &&
        bodyElement instanceof HTMLElement
      ) {
        moveCursorToEnd(bodyElement);
      }

      return true;
    },
    [editorRef, moveCursorToEnd],
  );

  const ensureTitleBlockWhenEditorIsEmpty = useCallback(
    (options?: { moveCaretTo?: "title" | "body" }) => {
      return ensureEditorScaffoldWhenEmpty(options);
    },
    [ensureEditorScaffoldWhenEmpty],
  );

  const syncEditorEmptyState = useCallback(() => {
    const editor = editorRef.current;
    const rootChildren = editor
      ? (Array.from(editor.children) as HTMLElement[])
      : [];
    const firstChild = rootChildren[0] ?? null;
    const titleElement =
      firstChild instanceof HTMLElement && firstChild.tagName === "H1"
        ? firstChild
        : null;
    const bodyElements = getBodyElements(rootChildren, titleElement);

    const titleText = getElementText(titleElement);
    const bodyText = bodyElements.map(getElementText).join(" ").trim();
    const bodyHtml = bodyElements
      .map((bodyElement) => bodyElement.outerHTML)
      .join("");
    const bodyHasMeaningfulContent = hasMeaningfulEditorContent(bodyHtml);

    const selection = window.getSelection();
    const hasCaretInBody = Boolean(
      selection &&
        selection.rangeCount > 0 &&
        bodyElements.some(
          (bodyElement) =>
            bodyElement.contains(selection.anchorNode) ||
            bodyElement === selection.anchorNode ||
            bodyElement.contains(selection.focusNode) ||
            bodyElement === selection.focusNode,
        ),
    );

    setIsTitleEmpty(Boolean(titleElement && titleText.length === 0));
    setIsBodyEmpty(
      !bodyHasMeaningfulContent && bodyText.length === 0 && !hasCaretInBody,
    );
  }, [editorRef]);

  return {
    ensureEditorScaffoldWhenEmpty,
    ensureTitleBlockWhenEditorIsEmpty,
    isBodyEmpty,
    isTitleEmpty,
    syncEditorEmptyState,
  };
};
