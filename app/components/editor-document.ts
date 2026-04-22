export type Document = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  titleMode: "auto" | "manual";
};

export const DEFAULT_DOCUMENT_TITLE = "documento sem título";
const MAX_AUTO_TITLE_LENGTH = 32;

export const FIRST_ACCESS_WELCOME_KEY = "calcify_first_access_welcome_seen_v1";
export const INITIAL_DOCUMENT_ID = "initial-document";
export const TITLE_PLACEHOLDER = "Título";
export const BODY_PLACEHOLDER = "Digite algum texto...";

export const FIRST_ACCESS_WELCOME_MARKDOWN = `# Marcos Nathanael

Eu sou o criado do calcify! Editor profissional que aceita markdown.

## Stacks usadas

- **Next.js**
- **TypeScript**
- **React**
- **Electron + electron-builder**
- **Tailwind CSS**
- **Markdown**
- **Math**

> "O impossível e só questão de opinião!"
>
> Chorão - Charlie Brown

[Github: RazielID752](https://github.com/RazielID752)

- **Superscript e Subscript:** x<sup>2</sup> e H<sub>2</sub>O para maior precisão.
- **Conversão tipográfica:** converter automaticamente \`->\` para uma seta \`→\`.
- **Cálculo automático:** \`10 * 50 / 2 % 0 = 250\`
- **Reconhecimento de símbolo de dinheiro:** \`50 * $10 = US$ 500,00\`
- **Conversão de moeda em tempo real:** \`converts: 100 USD to BRL\` → \`100 USD → BRL 496.50\` (usando a cotação atual). 

### Exemplo de comandos para conversão de moeda:
- **converts:** $10 to R$
- **converts:** 10 USD to BRL
- **converts:** €50 to USD
- **converts:** ¥50 to EUR
- **converts:** 10JPY to BRL

### O resultado e exibido automaticamente
- Exemplo: 20 USD → BRL 49.60.


\`\`\`js
JavaCript is life
Const Love = [199]
\`\`\`
`;

const trimAndCollapseWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

export const hasMeaningfulEditorContent = (html: string) => {
  const plainText = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length > 0) {
    return true;
  }

  return /<(img|video|audio|iframe|table|pre|blockquote|ul|ol|li|hr)\b/i.test(
    html,
  );
};

const shortenTitle = (value: string) => {
  const normalized = trimAndCollapseWhitespace(value);

  if (normalized.length <= MAX_AUTO_TITLE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_AUTO_TITLE_LENGTH).trimEnd()}...`;
};

export const getAutoTitleFromContent = (content: string) => {
  if (!content || typeof document === "undefined") {
    return DEFAULT_DOCUMENT_TITLE;
  }

  const container = document.createElement("div");
  container.innerHTML = content;

  const firstHeading = container.querySelector("h1");
  const headingText = trimAndCollapseWhitespace(
    firstHeading?.textContent ?? "",
  );

  if (!headingText) {
    return DEFAULT_DOCUMENT_TITLE;
  }

  return shortenTitle(headingText);
};

const createDocumentId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const createBlankDocument = (
  initialTitle = "",
  options?: { fixedId?: string },
): Document => {
  const normalizedTitle = trimAndCollapseWhitespace(initialTitle);
  const fixedId = options?.fixedId;

  return {
    id: fixedId ?? createDocumentId(),
    title: normalizedTitle || DEFAULT_DOCUMENT_TITLE,
    content: "",
    createdAt: fixedId ? new Date(0) : new Date(),
    titleMode: normalizedTitle ? "manual" : "auto",
  };
};
