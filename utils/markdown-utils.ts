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

const normalizeTableCellText = (value: string) =>
  value.replace(/\s+/g, " ").trim().replace(/\|/g, "\\|");

const toMarkdownTable = (table: HTMLTableElement) => {
  const headRows = table.tHead ? Array.from(table.tHead.rows) : [];
  const bodyRows =
    table.tBodies.length > 0
      ? Array.from(table.tBodies).flatMap((section) => Array.from(section.rows))
      : [];
  const fallbackRows = Array.from(table.rows);
  const allRows =
    headRows.length > 0 || bodyRows.length > 0
      ? [...headRows, ...bodyRows]
      : fallbackRows;

  if (allRows.length === 0) {
    return "";
  }

  const hasHead = headRows.length > 0;
  const headerRow = hasHead ? headRows[0] : allRows[0];
  const dataRows = hasHead ? bodyRows : allRows.slice(1);
  const columnCount = Math.max(headerRow.cells.length, 1);

  const rowToCells = (row: HTMLTableRowElement) => {
    const cells = Array.from(row.cells).map(
      (cell) => normalizeTableCellText(cell.textContent ?? "") || " ",
    );

    while (cells.length < columnCount) {
      cells.push(" ");
    }

    return cells.slice(0, columnCount);
  };

  const headerCells = rowToCells(headerRow);
  const headerLine = `| ${headerCells.join(" | ")} |`;
  const separatorLine = `| ${Array.from({ length: columnCount }, () => "---").join(" | ")} |`;
  const bodyLines = dataRows.map((row) => `| ${rowToCells(row).join(" | ")} |`);

  return [headerLine, separatorLine, ...bodyLines].join("\n");
};

turndownService.addRule("strikethrough", {
  filter(node) {
    return ["DEL", "S", "STRIKE"].includes(node.nodeName);
  },
  replacement(content: string) {
    return `~~${content}~~`;
  },
});

turndownService.addRule("table", {
  filter(node) {
    return node.nodeName === "TABLE";
  },
  replacement(_content, node) {
    if (!(node instanceof HTMLTableElement)) {
      return "\n\n";
    }

    const markdownTable = toMarkdownTable(node);

    if (!markdownTable) {
      return "\n\n";
    }

    return `\n\n${markdownTable}\n\n`;
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
