import { useCallback, useEffect, useRef, useState } from "react";
import { type Document, getAutoTitleFromContent } from "../editor-document";

const DRAG_HANDLE_SIZE_PX = 24;
const DRAG_GUTTER_LEFT_PX = 44;
const DRAG_LINE_HIT_PADDING_PX = 6;
const DRAGGABLE_TOP_LEVEL_TAGS = [
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "BLOCKQUOTE",
  "PRE",
] as const;

type UseBlockDragAndDropParams = {
  editorRef: React.RefObject<HTMLDivElement | null>;
  activeDocumentId: string;
  persistHtml: () => void;
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  updateSavedRange: () => void;
  syncEditorEmptyState: () => void;
};

export const useBlockDragAndDrop = ({
  editorRef,
  activeDocumentId,
  persistHtml,
  setDocuments,
  updateSavedRange,
  syncEditorEmptyState,
}: UseBlockDragAndDropParams) => {
  const [dragHandleTop, setDragHandleTop] = useState<number | null>(null);
  const [dragIndicatorTop, setDragIndicatorTop] = useState<number | null>(null);
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);
  const hoveredDragBlockRef = useRef<HTMLElement | null>(null);
  const dragSourceBlockRef = useRef<HTMLElement | null>(null);
  const dragInsertionBeforeRef = useRef<HTMLElement | null>(null);
  const dragMoveListenerRef = useRef<((event: MouseEvent) => void) | null>(
    null,
  );
  const dragEndListenerRef = useRef<((event: MouseEvent) => void) | null>(null);
  const dragKeydownListenerRef = useRef<
    ((event: KeyboardEvent) => void) | null
  >(null);

  const clearHoveredDragBlock = useCallback(() => {
    hoveredDragBlockRef.current = null;
    setDragHandleTop(null);
  }, []);

  const removeDragListeners = useCallback(() => {
    if (dragMoveListenerRef.current) {
      window.removeEventListener("mousemove", dragMoveListenerRef.current);
      dragMoveListenerRef.current = null;
    }

    if (dragEndListenerRef.current) {
      window.removeEventListener("mouseup", dragEndListenerRef.current);
      dragEndListenerRef.current = null;
    }

    if (dragKeydownListenerRef.current) {
      window.removeEventListener("keydown", dragKeydownListenerRef.current);
      dragKeydownListenerRef.current = null;
    }
  }, []);

  const isFirstTitleBlock = useCallback(
    (editor: HTMLDivElement, block: HTMLElement) =>
      editor.firstElementChild === block && block.tagName === "H1",
    [],
  );

  const isTopLevelDraggableBlock = useCallback(
    (editor: HTMLDivElement, element: HTMLElement) => {
      if (element.parentElement !== editor) {
        return false;
      }

      if (
        !DRAGGABLE_TOP_LEVEL_TAGS.includes(
          element.tagName as (typeof DRAGGABLE_TOP_LEVEL_TAGS)[number],
        )
      ) {
        return false;
      }

      if (isFirstTitleBlock(editor, element)) {
        return false;
      }

      return true;
    },
    [isFirstTitleBlock],
  );

  const isDraggableListItem = useCallback(
    (editor: HTMLDivElement, element: HTMLElement) => {
      if (element.tagName !== "LI") {
        return false;
      }

      const list = element.parentElement;

      if (!list || !(list.tagName === "UL" || list.tagName === "OL")) {
        return false;
      }

      return list.parentElement === editor;
    },
    [],
  );

  const getDraggableBlockFromTarget = useCallback(
    (target: EventTarget | null) => {
      const editor = editorRef.current;

      if (!editor || !(target instanceof Node)) {
        return null;
      }

      let current: Element | null =
        target.nodeType === Node.TEXT_NODE
          ? target.parentElement
          : (target as Element);

      while (current && current !== editor) {
        if (
          current instanceof HTMLElement &&
          isDraggableListItem(editor, current)
        ) {
          return current;
        }

        if (
          current instanceof HTMLElement &&
          isTopLevelDraggableBlock(editor, current)
        ) {
          return current;
        }

        current = current.parentElement;
      }

      return null;
    },
    [editorRef, isDraggableListItem, isTopLevelDraggableBlock],
  );

  const getPointerDraggableBlocks = useCallback(
    (editor: HTMLDivElement) => {
      const blocks: HTMLElement[] = [];

      for (const child of [...editor.children]) {
        if (!(child instanceof HTMLElement)) {
          continue;
        }

        if (isTopLevelDraggableBlock(editor, child)) {
          blocks.push(child);
          continue;
        }

        if (child.tagName === "UL" || child.tagName === "OL") {
          for (const listItem of [...child.children]) {
            if (!(listItem instanceof HTMLElement)) {
              continue;
            }

            if (isDraggableListItem(editor, listItem)) {
              blocks.push(listItem);
            }
          }
        }
      }

      return blocks;
    },
    [isDraggableListItem, isTopLevelDraggableBlock],
  );

  const getReorderCandidates = useCallback(
    (editor: HTMLDivElement, source: HTMLElement) => {
      if (source.tagName === "LI") {
        const list = source.parentElement;

        if (!list || !(list.tagName === "UL" || list.tagName === "OL")) {
          return [] as HTMLElement[];
        }

        return [...list.children].filter((node) => {
          if (!(node instanceof HTMLElement)) {
            return false;
          }

          return node !== source && node.tagName === "LI";
        }) as HTMLElement[];
      }

      return [...editor.children].filter((node) => {
        if (!(node instanceof HTMLElement)) {
          return false;
        }

        if (node === source) {
          return false;
        }

        return isTopLevelDraggableBlock(editor, node);
      }) as HTMLElement[];
    },
    [isTopLevelDraggableBlock],
  );

  const getDraggableBlockFromPointer = useCallback(
    (
      editor: HTMLDivElement,
      clientY: number,
      fallbackTarget: EventTarget | null,
    ) => {
      const targetBlock = getDraggableBlockFromTarget(fallbackTarget);

      if (targetBlock) {
        return targetBlock;
      }

      const draggableBlocks = getPointerDraggableBlocks(editor);

      if (draggableBlocks.length === 0) {
        return null;
      }

      for (const block of draggableBlocks) {
        const rect = block.getBoundingClientRect();
        const minY = rect.top - DRAG_LINE_HIT_PADDING_PX;
        const maxY = rect.bottom + DRAG_LINE_HIT_PADDING_PX;

        if (clientY >= minY && clientY <= maxY) {
          return block;
        }
      }

      return null;
    },
    [getDraggableBlockFromTarget, getPointerDraggableBlocks],
  );

  const updateHoveredDragHandleFromPointer = useCallback(
    (clientX: number, clientY: number, target: EventTarget | null) => {
      if (isDraggingBlock) {
        return;
      }

      const editor = editorRef.current;

      if (!editor) {
        return;
      }

      const editorRect = editor.getBoundingClientRect();
      const insideHorizontalRange =
        clientX >= editorRect.left - DRAG_GUTTER_LEFT_PX &&
        clientX <= editorRect.right;
      const insideVerticalRange =
        clientY >= editorRect.top && clientY <= editorRect.bottom;

      if (!insideHorizontalRange || !insideVerticalRange) {
        clearHoveredDragBlock();
        return;
      }

      const block = getDraggableBlockFromPointer(editor, clientY, target);

      if (!block) {
        clearHoveredDragBlock();
        return;
      }

      const blockRect = block.getBoundingClientRect();
      const nextTop =
        blockRect.top -
        editorRect.top +
        Math.max(0, (blockRect.height - DRAG_HANDLE_SIZE_PX) / 2);

      hoveredDragBlockRef.current = block;
      setDragHandleTop(nextTop);
    },
    [
      clearHoveredDragBlock,
      editorRef,
      getDraggableBlockFromPointer,
      isDraggingBlock,
    ],
  );

  const updateDragInsertionByPointer = useCallback(
    (clientY: number) => {
      const editor = editorRef.current;
      const source = dragSourceBlockRef.current;

      if (!editor || !source) {
        return;
      }

      const candidates = getReorderCandidates(editor, source);

      if (candidates.length === 0) {
        dragInsertionBeforeRef.current = null;
        setDragIndicatorTop(null);
        return;
      }

      let insertionBefore: HTMLElement | null = null;

      for (const candidate of candidates) {
        const rect = candidate.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (clientY < midpoint) {
          insertionBefore = candidate;
          break;
        }
      }

      dragInsertionBeforeRef.current = insertionBefore;

      const editorRect = editor.getBoundingClientRect();
      const indicatorTop = insertionBefore
        ? insertionBefore.getBoundingClientRect().top - editorRect.top
        : candidates[candidates.length - 1].getBoundingClientRect().bottom -
          editorRect.top;

      setDragIndicatorTop(Math.max(0, indicatorTop));
    },
    [editorRef, getReorderCandidates],
  );

  const cancelBlockDrag = useCallback(() => {
    const source = dragSourceBlockRef.current;

    if (source) {
      source.style.removeProperty("opacity");
    }

    dragSourceBlockRef.current = null;
    dragInsertionBeforeRef.current = null;
    setDragIndicatorTop(null);
    setIsDraggingBlock(false);
    removeDragListeners();
  }, [removeDragListeners]);

  const finishBlockDrag = useCallback(() => {
    const editor = editorRef.current;
    const source = dragSourceBlockRef.current;
    const insertionBefore = dragInsertionBeforeRef.current;

    if (source) {
      source.style.removeProperty("opacity");
    }

    if (editor && source) {
      const isListItem = source.tagName === "LI";
      const sourceContainer = isListItem ? source.parentElement : editor;
      const shouldMove = insertionBefore
        ? insertionBefore !== source.nextElementSibling
        : sourceContainer?.lastElementChild !== source;

      if (shouldMove) {
        if (isListItem) {
          const list = source.parentElement;

          if (list && (list.tagName === "UL" || list.tagName === "OL")) {
            if (insertionBefore && insertionBefore.parentElement === list) {
              list.insertBefore(source, insertionBefore);
            } else {
              list.appendChild(source);
            }
          }
        } else if (insertionBefore) {
          editor.insertBefore(source, insertionBefore);
        } else {
          editor.appendChild(source);
        }

        const nextHtml = editor.innerHTML;
        persistHtml();
        setDocuments((previousDocuments) =>
          previousDocuments.map((documentItem) => {
            if (documentItem.id !== activeDocumentId) {
              return documentItem;
            }

            return {
              ...documentItem,
              content: nextHtml,
              title:
                documentItem.titleMode === "manual"
                  ? documentItem.title
                  : getAutoTitleFromContent(nextHtml),
            };
          }),
        );
        updateSavedRange();
        syncEditorEmptyState();
      }
    }

    dragSourceBlockRef.current = null;
    dragInsertionBeforeRef.current = null;
    setDragIndicatorTop(null);
    setIsDraggingBlock(false);
    removeDragListeners();
  }, [
    activeDocumentId,
    editorRef,
    persistHtml,
    removeDragListeners,
    setDocuments,
    syncEditorEmptyState,
    updateSavedRange,
  ]);

  const handleStartBlockDrag = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const editor = editorRef.current;
      const source = hoveredDragBlockRef.current;
      const isDraggableSource =
        !!editor &&
        !!source &&
        (isTopLevelDraggableBlock(editor, source) ||
          isDraggableListItem(editor, source));

      if (!isDraggableSource || !editor || !source) {
        return;
      }

      setIsDraggingBlock(true);
      dragSourceBlockRef.current = source;
      source.style.opacity = "0.55";

      updateDragInsertionByPointer(event.clientY);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        updateDragInsertionByPointer(moveEvent.clientY);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        updateDragInsertionByPointer(upEvent.clientY);
        finishBlockDrag();
      };

      const handleKeyDown = (keyEvent: KeyboardEvent) => {
        if (keyEvent.key === "Escape") {
          keyEvent.preventDefault();
          cancelBlockDrag();
        }
      };

      removeDragListeners();
      dragMoveListenerRef.current = handleMouseMove;
      dragEndListenerRef.current = handleMouseUp;
      dragKeydownListenerRef.current = handleKeyDown;
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("keydown", handleKeyDown);
    },
    [
      cancelBlockDrag,
      editorRef,
      finishBlockDrag,
      isDraggableListItem,
      isTopLevelDraggableBlock,
      removeDragListeners,
      updateDragInsertionByPointer,
    ],
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      updateHoveredDragHandleFromPointer(
        event.clientX,
        event.clientY,
        event.target,
      );
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [updateHoveredDragHandleFromPointer]);

  useEffect(() => {
    return () => {
      removeDragListeners();
    };
  }, [removeDragListeners]);

  return {
    dragHandleTop,
    dragIndicatorTop,
    isDraggingBlock,
    clearHoveredDragBlock,
    finishBlockDrag,
    handleStartBlockDrag,
  };
};
