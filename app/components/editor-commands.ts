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

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

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
  list(context: EditorContext, type: ListType) {
    runExecCommand(
      context,
      type === "bullet" ? "insertUnorderedList" : "insertOrderedList",
    );
  },
  blockquote(context: EditorContext) {
    runExecCommand(context, "formatBlock", "blockquote");
  },
  codeBlock(context: EditorContext) {
    runExecCommand(context, "formatBlock", "pre");
  },
  bold(context: EditorContext) {
    runExecCommand(context, "bold");
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
    runExecCommand(context, "subscript");
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

    const selectedText = selection.toString() || "code";
    const safeText = escapeHtml(selectedText);
    document.execCommand("insertHTML", false, `<code>${safeText}</code>`);
  },
  link(context: EditorContext, href: string) {
    runExecCommand(context, "createLink", href);
  },
  image(context: EditorContext, src: string) {
    runExecCommand(context, "insertImage", src);
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
