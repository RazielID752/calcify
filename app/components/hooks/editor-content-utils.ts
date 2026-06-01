export const getElementFromNode = (node: Node | null) => {
  if (!node) {
    return null;
  }

  return node.nodeType === Node.TEXT_NODE
    ? node.parentElement
    : (node as Element);
};

export const isImageOnlyElement = (element: HTMLElement) => {
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

export const getSelectionBlockElement = (editor: HTMLDivElement) => {
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

export const moveCaretToEnd = (element: HTMLElement) => {
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

export const isCaretAtEndOfBlock = (block: HTMLElement) => {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
    return false;
  }

  const range = selection.getRangeAt(0).cloneRange();
  const afterCaretRange = document.createRange();
  afterCaretRange.selectNodeContents(block);
  afterCaretRange.setStart(range.endContainer, range.endOffset);

  return afterCaretRange.toString().trim().length === 0;
};
