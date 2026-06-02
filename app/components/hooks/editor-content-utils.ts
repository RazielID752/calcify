export const getElementFromNode = (node: Node | null) => {
  if (!node) {
    return null;
  }

  return node.nodeType === Node.TEXT_NODE
    ? node.parentElement
    : (node as Element);
};

const ROOT_BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "H1",
  "H2",
  "H3",
  "H4",
  "UL",
  "OL",
  "BLOCKQUOTE",
  "PRE",
  "TABLE",
  "HR",
]);

const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4"]);

const isBlankTextNode = (node: Node) =>
  node.nodeType === Node.TEXT_NODE &&
  (node.textContent ?? "").replaceAll("\u00A0", " ").trim().length === 0;

const isRootBlockElement = (node: Node): node is HTMLElement =>
  node instanceof HTMLElement && ROOT_BLOCK_TAGS.has(node.tagName);

const headingHasContent = (heading: HTMLElement) =>
  (heading.textContent ?? "").replaceAll("\u00A0", " ").trim().length > 0 ||
  Boolean(heading.querySelector("img,video,audio,iframe"));

const ensureHeadingPlaceholder = (heading: HTMLElement) => {
  if (headingHasContent(heading)) {
    return;
  }

  heading.innerHTML = "<br>";
};

const moveNestedBlocksAfterHeading = (heading: HTMLElement) => {
  let insertAfter: ChildNode = heading;
  let movedNestedBlock = false;

  for (const child of [...heading.childNodes]) {
    if (!isRootBlockElement(child)) {
      continue;
    }

    heading.parentNode?.insertBefore(child, insertAfter.nextSibling);
    insertAfter = child;
    movedNestedBlock = true;
  }

  if (movedNestedBlock) {
    ensureHeadingPlaceholder(heading);
  }

  return movedNestedBlock;
};

const wrapRootTextNode = (editor: HTMLDivElement, node: ChildNode) => {
  if (isBlankTextNode(node)) {
    node.remove();
    return true;
  }

  if (node.nodeType !== Node.TEXT_NODE) {
    return false;
  }

  const paragraph = document.createElement("p");
  editor.insertBefore(paragraph, node);
  paragraph.appendChild(node);
  return true;
};

export const normalizeEditorContentStructure = (editor: HTMLDivElement) => {
  let changed = false;

  for (const child of [...editor.childNodes]) {
    if (wrapRootTextNode(editor, child)) {
      changed = true;
    }
  }

  for (const heading of [
    ...editor.querySelectorAll("h1,h2,h3,h4"),
  ] as HTMLElement[]) {
    if (!HEADING_TAGS.has(heading.tagName) || !editor.contains(heading)) {
      continue;
    }

    if (moveNestedBlocksAfterHeading(heading)) {
      changed = true;
    }
  }

  return changed;
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
