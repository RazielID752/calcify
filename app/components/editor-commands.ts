import DOMPurify from "dompurify";
import { marked } from "marked";
import TurndownService from "turndown";

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

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
});

turndownService.addRule("strikethrough", {
  filter(node) {
    return ["DEL", "S", "STRIKE"].includes(node.nodeName);
  },
  replacement(content: string) {
    return `~~${content}~~`;
  },
});

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
    const parsed = marked.parse(markdown, {
      gfm: true,
      breaks: true,
    });

    const html = typeof parsed === "string" ? parsed : "";

    return DOMPurify.sanitize(html);
  },
  htmlToMarkdown(html: string) {
    return turndownService.turndown(html);
  },
};
