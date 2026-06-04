export const getElementFromNode = (node: Node | null) => {
  if (!node) {
    return null;
  }

  const element =
    node.nodeType === Node.TEXT_NODE
      ? node.parentElement
      : node instanceof HTMLElement
        ? node
        : node.parentElement;

  if (element instanceof HTMLElement) {
    return element;
  }

  return null;
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
const ROOT_BLOCK_SELECTOR = [...ROOT_BLOCK_TAGS]
  .map((tag) => tag.toLowerCase())
  .join(",");

const isBlankTextNode = (node: Node) =>
  node.nodeType === Node.TEXT_NODE &&
  (node.textContent ?? "").replaceAll("\u00A0", " ").trim().length === 0;

const isIgnorableNode = (node: Node) =>
  isBlankTextNode(node) || node instanceof HTMLBRElement;

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

const unwrapBlockElementsFromSpans = (editor: HTMLDivElement) => {
  let changed = false;

  for (const span of [...editor.querySelectorAll("span")]) {
    if (!span.querySelector(ROOT_BLOCK_SELECTOR)) {
      continue;
    }

    span.replaceWith(...span.childNodes);
    changed = true;
  }

  return changed;
};

const unwrapListsFromBlocks = (editor: HTMLDivElement) => {
  let changed = false;

  for (const block of [...editor.querySelectorAll<HTMLElement>("p,div")]) {
    if (block.parentElement !== editor) {
      continue;
    }

    const listChildren = [...block.children].filter((child) =>
      child instanceof HTMLElement
        ? child.tagName === "UL" || child.tagName === "OL"
        : false,
    ) as HTMLElement[];

    if (listChildren.length === 0) {
      continue;
    }

    const hasOnlyLists = [...block.childNodes].every(
      (node) =>
        (node instanceof HTMLElement &&
          (node.tagName === "UL" || node.tagName === "OL")) ||
        isIgnorableNode(node),
    );

    let insertAfter: HTMLElement = block;

    for (const list of listChildren) {
      insertAfter.after(list);
      insertAfter = list;
    }

    if (hasOnlyLists) {
      block.remove();
    }

    changed = true;
  }

  return changed;
};

const unwrapNestedParagraphs = (editor: HTMLDivElement) => {
  let changed = false;

  for (const paragraph of [...editor.querySelectorAll("p")]) {
    if (paragraph.parentElement !== editor) {
      continue;
    }

    const nestedParagraphs = [...paragraph.querySelectorAll("p")];

    if (nestedParagraphs.length === 0) {
      continue;
    }

    let insertAfter: HTMLElement = paragraph;

    for (const nested of nestedParagraphs) {
      insertAfter.after(nested);
      insertAfter = nested;
    }

    if (
      [...paragraph.childNodes].every((node) => isIgnorableNode(node)) &&
      !paragraph.querySelector("img,video,audio,iframe,table")
    ) {
      paragraph.remove();
    }

    changed = true;
  }

  return changed;
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

  if (unwrapBlockElementsFromSpans(editor)) {
    changed = true;
  }

  if (unwrapListsFromBlocks(editor)) {
    changed = true;
  }

  if (unwrapNestedParagraphs(editor)) {
    changed = true;
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
