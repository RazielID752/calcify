import DOMPurify from "dompurify";
import { marked } from "marked";

export function renderMarkdownToHtml(markdown: string) {
  const normalizedMarkdown = markdown
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n");
  const rawHtml = marked.parse(normalizedMarkdown, {
    gfm: true,
    breaks: true,
  });
  const html = typeof rawHtml === "string" ? rawHtml : "";

  return DOMPurify.sanitize(html);
}
