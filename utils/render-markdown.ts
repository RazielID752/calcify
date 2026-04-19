import DOMPurify from "dompurify";
import { marked } from "marked";

export function renderMarkdownToHtml(markdown: string) {
  const rawHtml = marked.parse(markdown);

  return DOMPurify.sanitize(`${rawHtml}`);
}
