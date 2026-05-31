import {
  htmlToMarkdown as markdownUtilsHtmlToMarkdown,
  renderMarkdownToHtml,
} from "@/utils/markdown-utils";

export type HeadingLevel = "h1" | "h2" | "h3" | "h4";
export type ListType = "bullet" | "ordered";
export type AlignType = "left" | "center" | "right";

export type MathOption = {
  value: string;
  label: string;
  template: string;
};

export const mathOptions: MathOption[] = [
  { value: "sum", label: "Soma (+)", template: " + " },
  { value: "subtract", label: "Subtracao (-)", template: " - " },
  { value: "multiply", label: "Multiplicacao (*)", template: " * " },
  { value: "divide", label: "Divisao (/)", template: " / " },
  { value: "percentage", label: "Porcentagem (%)", template: " % " },
  { value: "power", label: "Potencia (pow)", template: "pow(,)" },
  { value: "sqrt", label: "Raiz (sqrt)", template: "sqrt()" },
  { value: "abs", label: "Absoluto (abs)", template: "abs()" },
  { value: "round", label: "Arredondar (round)", template: "round()" },
  { value: "floor", label: "Piso (floor)", template: "floor()" },
  { value: "ceil", label: "Teto (ceil)", template: "ceil()" },
  { value: "min", label: "Minimo (min)", template: "min(,)" },
  { value: "max", label: "Maximo (max)", template: "max(,)" },
  { value: "sin", label: "Seno (sin)", template: "sin()" },
  { value: "cos", label: "Cosseno (cos)", template: "cos()" },
  { value: "tan", label: "Tangente (tan)", template: "tan()" },
  { value: "log", label: "Log (log)", template: "log()" },
  { value: "pi", label: "Pi (π)", template: "π" },
];

export type EditorContext = {
  editor: HTMLDivElement;
  savedRange: Range | null;
};

type LinkOptions = {
  openInNewTab?: boolean;
};

const escapeHtmlAttribute = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const restoreSelection = ({ editor, savedRange }: EditorContext) => {
  editor.focus();

  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  selection.removeAllRanges();

  if (
    !savedRange ||
    !editor.contains(savedRange.startContainer) ||
    !editor.contains(savedRange.endContainer)
  ) {
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.addRange(range);
    return;
  }

  selection.addRange(savedRange.cloneRange());
};

const runExecCommand = (
  context: EditorContext,
  command: string,
  value?: string,
) => {
  restoreSelection(context);
  document.execCommand(command, false, value);
};

const unwrapElement = (element: HTMLElement) => {
  const parent = element.parentNode;

  if (!parent) {
    return;
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
};

const getSelectionElement = (node: Node | null) => {
  if (!node) {
    return null;
  }

  return node.nodeType === Node.TEXT_NODE
    ? node.parentElement
    : (node as Element);
};

const getClosestBlockElement = (context: EditorContext) => {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const anchorElement = getSelectionElement(selection.anchorNode);
  const focusElement = getSelectionElement(selection.focusNode);
  const selectors = "p,div,h1,h2,h3,h4,blockquote,pre,li";

  const anchorBlock = anchorElement?.closest(selectors);
  if (
    anchorBlock instanceof HTMLElement &&
    context.editor.contains(anchorBlock)
  ) {
    return anchorBlock;
  }

  const focusBlock = focusElement?.closest(selectors);
  if (
    focusBlock instanceof HTMLElement &&
    context.editor.contains(focusBlock)
  ) {
    return focusBlock;
  }

  return null;
};

const findScriptAncestor = (
  element: Element | null,
  editor: HTMLElement,
  type: "subscript" | "superscript",
) => {
  if (!element) {
    return null;
  }

  const expectedTag = type === "subscript" ? "SUB" : "SUP";
  const expectedVerticalAlign = type === "subscript" ? "sub" : "super";

  let current: Element | null = element;

  while (current && current !== editor) {
    if (current instanceof HTMLElement) {
      if (current.tagName === expectedTag) {
        return current;
      }

      if (
        current.style.verticalAlign.trim().toLowerCase() ===
        expectedVerticalAlign
      ) {
        return current;
      }
    }

    current = current.parentElement;
  }

  return null;
};

const toggleScriptCommand = (
  context: EditorContext,
  type: "subscript" | "superscript",
) => {
  restoreSelection(context);

  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const anchorElement = getSelectionElement(selection.anchorNode);
  const focusElement = getSelectionElement(selection.focusNode);
  const activeAncestor =
    findScriptAncestor(anchorElement, context.editor, type) ??
    findScriptAncestor(focusElement, context.editor, type);

  if (activeAncestor && context.editor.contains(activeAncestor)) {
    unwrapElement(activeAncestor);
    return;
  }

  runExecCommand(context, type);
};

const isTransparentColor = (value: string) => {
  const normalized = value.trim().toLowerCase();

  return (
    normalized.length === 0 ||
    normalized === "transparent" ||
    normalized === "rgba(0, 0, 0, 0)" ||
    normalized === "initial" ||
    normalized === "inherit" ||
    normalized === "unset" ||
    normalized === "none" ||
    normalized === "false"
  );
};

const isHighlightElement = (element: HTMLElement) => {
  if (element.tagName === "MARK") {
    return true;
  }

  const computedBg = window.getComputedStyle(element).backgroundColor;
  return !isTransparentColor(computedBg);
};

const clearHighlightFormatting = (context: EditorContext) => {
  const editor = context.editor;
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  const nodesToClear: HTMLElement[] = [];

  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (!(node instanceof HTMLElement)) {
        return NodeFilter.FILTER_SKIP;
      }

      if (!range.intersectsNode(node)) {
        return NodeFilter.FILTER_SKIP;
      }

      return isHighlightElement(node)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    },
  });

  let currentNode = walker.nextNode();

  while (currentNode) {
    if (currentNode instanceof HTMLElement) {
      nodesToClear.push(currentNode);
    }

    currentNode = walker.nextNode();
  }

  for (const element of nodesToClear) {
    if (element.tagName === "MARK") {
      const parent = element.parentNode;

      if (!parent) {
        continue;
      }

      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }

      parent.removeChild(element);
      continue;
    }

    element.style.backgroundColor = "";

    if (!element.getAttribute("style")?.trim()) {
      element.removeAttribute("style");
    }
  }

  restoreSelection(context);
};

const collectLinksFromCurrentSelection = (editor: HTMLDivElement) => {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return [];
  }

  const range = selection.getRangeAt(0);
  const links = new Set<HTMLAnchorElement>();

  const addClosestAnchorFromNode = (node: Node | null) => {
    const element = getSelectionElement(node);
    const closestAnchor = element?.closest("a");

    if (
      closestAnchor instanceof HTMLAnchorElement &&
      editor.contains(closestAnchor)
    ) {
      links.add(closestAnchor);
    }
  };

  addClosestAnchorFromNode(selection.anchorNode);
  addClosestAnchorFromNode(selection.focusNode);
  addClosestAnchorFromNode(range.commonAncestorContainer);

  const rangeRoot = getSelectionElement(range.commonAncestorContainer);
  const searchRoot = rangeRoot instanceof HTMLElement ? rangeRoot : editor;
  const anchors = searchRoot.querySelectorAll("a");

  for (const anchor of anchors) {
    if (editor.contains(anchor) && range.intersectsNode(anchor)) {
      links.add(anchor);
    }
  }

  return [...links];
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

const getImageTargetsFromSelection = (editor: HTMLDivElement) => {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return [];
  }

  const range = selection.getRangeAt(0);
  const targets = new Set<HTMLElement>();

  const intersectedImages = [...editor.querySelectorAll("img")].filter((img) =>
    range.intersectsNode(img),
  );

  for (const image of intersectedImages) {
    targets.add(image);
  }

  const anchorElement = getSelectionElement(selection.anchorNode);
  const directImage = anchorElement?.closest("img");

  if (directImage instanceof HTMLElement && editor.contains(directImage)) {
    targets.add(directImage);
  }

  const currentBlock = anchorElement?.closest("p,div,li,blockquote");

  if (
    currentBlock instanceof HTMLElement &&
    editor.contains(currentBlock) &&
    isImageOnlyElement(currentBlock)
  ) {
    targets.add(currentBlock);
  }

  if (range.startContainer === editor) {
    const siblings = [
      editor.childNodes[range.startOffset - 1],
      editor.childNodes[range.startOffset],
    ];

    for (const sibling of siblings) {
      if (sibling instanceof HTMLElement) {
        if (sibling.tagName === "IMG") {
          targets.add(sibling);
          continue;
        }

        if (isImageOnlyElement(sibling)) {
          targets.add(sibling);
        }
      }
    }
  }

  return [...targets];
};

const deleteNodeWithHistory = (target: HTMLElement) => {
  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNode(target);
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand("delete", false);
};

const formatSelectionAsParagraph = () => {
  for (const option of ["P", "p", "<p>"]) {
    if (document.execCommand("formatBlock", false, option)) {
      return;
    }
  }
};

export const editorCommands = {
  undo(context: EditorContext) {
    runExecCommand(context, "undo");
  },
  redo(context: EditorContext) {
    runExecCommand(context, "redo");
  },
  heading(context: EditorContext, level: HeadingLevel) {
    restoreSelection(context);

    // Priorizamos as tags sem os símbolos de "menor e maior".
    // Em navegadores modernos, enviar "<h1>" pode fazer o Chrome "embrulhar" (aninhar)
    // a tag dentro da atual em vez de substituir o bloco inteiro.
    const options = [level.toUpperCase(), level, `<${level}>`];

    for (const option of options) {
      if (document.execCommand("formatBlock", false, option)) {
        return;
      }
    }

    document.execCommand("formatBlock", false, "p");
  },
  resetFormatting(context: EditorContext) {
    restoreSelection(context);

    if (document.queryCommandState("insertUnorderedList")) {
      document.execCommand("insertUnorderedList", false);
    }

    if (document.queryCommandState("insertOrderedList")) {
      document.execCommand("insertOrderedList", false);
    }

    document.execCommand("removeFormat", false);
    document.execCommand("unlink", false);
    formatSelectionAsParagraph();
    document.execCommand("justifyLeft", false);
  },
  list(context: EditorContext, type: ListType) {
    runExecCommand(
      context,
      type === "bullet" ? "insertUnorderedList" : "insertOrderedList",
    );
  },
  blockquote(context: EditorContext) {
    restoreSelection(context);

    const currentBlock = getClosestBlockElement(context);
    const activeBlockquote =
      currentBlock?.tagName === "BLOCKQUOTE"
        ? currentBlock
        : currentBlock?.closest("blockquote");

    if (activeBlockquote instanceof HTMLElement) {
      for (const option of ["P", "p", "<p>"]) {
        if (document.execCommand("formatBlock", false, option)) {
          return;
        }
      }
    }

    runExecCommand(context, "formatBlock", "blockquote");
  },
  codeBlock(context: EditorContext) {
    runExecCommand(context, "formatBlock", "pre");
  },
  bold(context: EditorContext) {
    restoreSelection(context);

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const anchorElement =
      selection.anchorNode?.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : (selection.anchorNode as Element | null);

    const boldAncestor = anchorElement?.closest("strong,b");
    const isBoldActive =
      boldAncestor instanceof HTMLElement &&
      context.editor.contains(boldAncestor);

    if (isBoldActive) {
      unwrapElement(boldAncestor);
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedContent = range.extractContents();

    const strongElement = document.createElement("strong");
    strongElement.appendChild(selectedContent);
    range.insertNode(strongElement);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(strongElement);
    selection.addRange(newRange);
  },
  italic(context: EditorContext) {
    runExecCommand(context, "italic");
  },
  strike(context: EditorContext) {
    runExecCommand(context, "strikeThrough");
  },
  underline(context: EditorContext) {
    runExecCommand(context, "underline");
  },
  highlight(context: EditorContext) {
    restoreSelection(context);

    const commandValue = `${document.queryCommandValue("hiliteColor") ?? ""}`;
    const selection = window.getSelection();
    const anchorElement =
      selection?.anchorNode?.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : (selection?.anchorNode as Element | null);
    const highlightAncestor = anchorElement?.closest("mark,span");
    const isActiveByCommand = !isTransparentColor(commandValue);
    const isActiveByAncestor =
      highlightAncestor instanceof HTMLElement &&
      isHighlightElement(highlightAncestor);

    const shouldRemoveHighlight = isActiveByCommand || isActiveByAncestor;

    if (shouldRemoveHighlight) {
      runExecCommand(context, "hiliteColor", "transparent");
      runExecCommand(context, "backColor", "transparent");
      clearHighlightFormatting(context);
      return;
    }

    runExecCommand(context, "hiliteColor", "#fff5a6");
  },
  subscript(context: EditorContext) {
    toggleScriptCommand(context, "subscript");
  },
  superscript(context: EditorContext) {
    toggleScriptCommand(context, "superscript");
  },
  align(context: EditorContext, align: AlignType) {
    const command =
      align === "left"
        ? "justifyLeft"
        : align === "center"
          ? "justifyCenter"
          : "justifyRight";

    runExecCommand(context, command);
  },
  inlineCode(context: EditorContext) {
    restoreSelection(context);

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const anchorNode = selection.anchorNode;
    const anchorElement = anchorNode
      ? anchorNode.nodeType === Node.TEXT_NODE
        ? anchorNode.parentElement
        : (anchorNode as Element)
      : null;
    const codeAncestor = anchorElement?.closest("code");

    // Toggle: se o cursor/selecao estiver em um <code>, remove o wrapper.
    if (codeAncestor && context.editor.contains(codeAncestor)) {
      const parent = codeAncestor.parentNode;

      if (!parent) {
        return;
      }

      while (codeAncestor.firstChild) {
        parent.insertBefore(codeAncestor.firstChild, codeAncestor);
      }

      parent.removeChild(codeAncestor);
      return;
    }

    const codeElement = document.createElement("code");

    if (range.collapsed) {
      codeElement.textContent = "code";
      range.insertNode(codeElement);
    } else {
      const selectedText = selection.toString() || "code";
      codeElement.textContent = selectedText;
      range.deleteContents();
      range.insertNode(codeElement);
    }

    const caretRange = document.createRange();
    caretRange.selectNodeContents(codeElement);
    caretRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(caretRange);
  },
  link(context: EditorContext, href: string, options?: LinkOptions) {
    runExecCommand(context, "createLink", href);

    const links = collectLinksFromCurrentSelection(context.editor);
    const openInNewTab = Boolean(options?.openInNewTab);

    for (const link of links) {
      if (openInNewTab) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      } else {
        link.removeAttribute("target");
        link.removeAttribute("rel");
      }
    }
  },
  unlink(context: EditorContext) {
    restoreSelection(context);

    const links = collectLinksFromCurrentSelection(context.editor);

    if (links.length > 0) {
      for (const link of links) {
        unwrapElement(link);
      }

      return;
    }

    runExecCommand(context, "unlink");
  },
  image(context: EditorContext, src: string) {
    const escapedSrc = escapeHtmlAttribute(src);
    const imageHtml =
      `<p data-editor-image-line="true">` +
      `<img src="${escapedSrc}" alt="Imagem" width="560" data-editor-image="true" style="max-width:100%;height:auto;border-radius:12px;display:block;" />` +
      `</p><p><br></p>`;

    runExecCommand(context, "insertHTML", imageHtml);
  },
  removeImage(context: EditorContext) {
    restoreSelection(context);

    const targets = getImageTargetsFromSelection(context.editor);

    if (targets.length === 0) {
      return;
    }

    for (const target of targets) {
      const imageLine = target.closest("p,div,li,blockquote");

      if (
        imageLine instanceof HTMLElement &&
        context.editor.contains(imageLine) &&
        isImageOnlyElement(imageLine)
      ) {
        deleteNodeWithHistory(imageLine);
        continue;
      }

      deleteNodeWithHistory(target);
    }

    if (context.editor.innerHTML.trim() === "") {
      context.editor.innerHTML = "<p><br></p>";
    }
  },
  insertMath(context: EditorContext, expression: string) {
    restoreSelection(context);
    document.execCommand("insertText", false, expression);
  },
  markdownToHtml(markdown: string) {
    return renderMarkdownToHtml(markdown);
  },
  htmlToMarkdown(html: string) {
    return markdownUtilsHtmlToMarkdown(html);
  },
};
