import DOMPurify from "dompurify";
import { marked } from "marked";
import TurndownService from "turndown";

// Instância global de TurndownService para HTML → Markdown
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

/**
 * Renderiza Markdown para HTML sanitizado
 * Utiliza marked para parsing e DOMPurify para sanitização
 */
export function renderMarkdownToHtml(markdown: string): string {
  try {
    const rawHtml = marked.parse(markdown, {
      gfm: true,
      breaks: true,
    });

    const html = typeof rawHtml === "string" ? rawHtml : "";

    return DOMPurify.sanitize(html);
  } catch (error) {
    console.error("Erro ao renderizar Markdown:", error);
    return DOMPurify.sanitize(
      `<p>${DOMPurify.sanitize(markdown, { ALLOWED_TAGS: [] })}</p>`,
    );
  }
}

/**
 * Converte HTML para Markdown
 * Utiliza TurndownService para conversão segura
 */
export function htmlToMarkdown(html: string): string {
  try {
    return turndownService.turndown(html);
  } catch (error) {
    console.error("Erro ao converter HTML para Markdown:", error);
    return html;
  }
}

/**
 * Detecta se uma string contém Markdown válido
 */
export function isValidMarkdown(text: string): boolean {
  return /^[#*\->`>]|(\*\*|__|~~|`|!)/.test(text.trim());
}

/**
 * Detecta o tipo de bloco Markdown no início da linha
 */
export function detectMarkdownBlock(
  line: string,
): "heading" | "list" | "quote" | "code" | null {
  const trimmed = line.trim();

  if (/^#{1,6}\s/.test(trimmed)) return "heading";
  if (/^[-*]\s|^\d+\.\s/.test(trimmed)) return "list";
  if (/^>/.test(trimmed)) return "quote";
  if (/^```|^~~~/.test(trimmed)) return "code";

  return null;
}

/**
 * Extrai blocos de Markdown de um texto multilinhas
 */
export function extractMarkdownBlocks(text: string): string[] {
  return text
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => line.trim());
}

/**
 * Aplica formatação de Markdown inline (bold, italic, code) a um texto
 */
export function applyInlineMarkdown(text: string): string {
  // Aplica negrito
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.*)__/g, "<strong>$1</strong>");

  // Aplica itálico
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
  text = text.replace(/_(.*)_/g, "<em>$1</em>");

  // Aplica código inline
  text = text.replace(/`(.*?)`/g, "<code>$1</code>");

  // Aplica strikethrough
  text = text.replace(/~~(.*?)~~/g, "<del>$1</del>");

  return text;
}

export { turndownService };
