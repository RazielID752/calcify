/**
 * EXEMPLOS PRÁTICOS: Como usar o novo sistema de Markdown
 * 
 * Este arquivo contém exemplos reais de como integrar o sistema
 * de Markdown em seus componentes React.
 */

// ============================================================
// EXEMPLO 1: Usar Utilitários Diretamente
// ============================================================

import {
  renderMarkdownToHtml,
  htmlToMarkdown,
  detectMarkdownBlock,
  isValidMarkdown,
  extractMarkdownBlocks,
} from "@/utils/markdown-utils";

// Converter Markdown para HTML
function exemplo1RendererMarkdown() {
  const markdown = `
# Meu Título

Este é um parágrafo com **negrito** e *itálico*.

- Item 1
- Item 2
- Item 3

> Uma citação importante
  `;

  const html = renderMarkdownToHtml(markdown);
  console.log(html); // HTML sanitizado e pronto para render
}

// Converter HTML para Markdown
function exemplo2ExportarMarkdown() {
  const html = `
    <h1>Meu Título</h1>
    <p>Parágrafo com <strong>negrito</strong> e <em>itálico</em>.</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  `;

  const markdown = htmlToMarkdown(html);
  console.log(markdown); // Markdown válido
}

// Detectar tipo de bloco
function exemplo3DetectarBloco() {
  detectMarkdownBlock("# Título"); // "heading"
  detectMarkdownBlock("- Item"); // "list"
  detectMarkdownBlock("> Quote"); // "quote"
  detectMarkdownBlock("```js"); // "code"
  detectMarkdownBlock("Texto normal"); // null
}

// Validar Markdown
function exemplo4ValidarMarkdown() {
  isValidMarkdown("# Título"); // true
  isValidMarkdown("**bold**"); // true
  isValidMarkdown("Texto normal"); // false
}

// Extrair blocos
function exemplo5ExtrairBlocos() {
  const markdown = `# Título
**bold**
- item
> quote`;

  const blocos = extractMarkdownBlocks(markdown);
  console.log(blocos);
  // ["# Título", "**bold**", "- item", "> quote"]
}

// ============================================================
// EXEMPLO 2: Via Commands Editor
// ============================================================

import { editorCommands } from "@/components/editor-commands";

function exemplo6ViaCommands() {
  // Markdown para HTML
  const html = editorCommands.markdownToHtml(
    `# Título\n**bold**\n- item`,
  );

  // HTML para Markdown
  const markdown = editorCommands.htmlToMarkdown(
    "<h1>Título</h1><strong>bold</strong>",
  );

  console.log({ html, markdown });
}

// ============================================================
// EXEMPLO 3: Usar Hook useMarkdownRenderer
// ============================================================

import {
  useMarkdownRenderer,
} from "@/components/hooks/use-markdown-renderer";
import { useRef } from "react";

function exemplo7HookMarkdown() {
  const editorRef = useRef<HTMLDivElement>(null);

  const { debouncedRenderMarkdown, handlePastedMarkdown, forceRender } =
    useMarkdownRenderer({
      editorRef,
      onHtmlChange: (html) => {
        console.log("HTML atualizado:", html);
        // Aqui você atualizaria o editor com o HTML
      },
      debounceMs: 500, // Espera 500ms após última mudança
    });

  return (
    <div>
      <div
        ref={editorRef}
        contentEditable
        onInput={() => debouncedRenderMarkdown()}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text/plain");
          handlePastedMarkdown(text);
        }}
      />
      <button onClick={forceRender}>Renderizar Agora</button>
    </div>
  );
}

// ============================================================
// EXEMPLO 4: Componente Prático - Editor com Preview
// ============================================================

import { useCallback, useEffect, useState } from "react";

export function ExemploEditorComPreview() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState("");

  const handleMarkdownChange = useCallback((markdown: string) => {
    const html = renderMarkdownToHtml(markdown);
    setPreview(html);
  }, []);

  return (
    <div className="flex gap-4">
      {/* Editor */}
      <div className="flex-1">
        <h2>Editor Markdown</h2>
        <div
          ref={editorRef}
          contentEditable
          className="border p-4 min-h-96"
          onInput={(e) => {
            const text = (e.target as HTMLDivElement).innerText;
            handleMarkdownChange(text);
          }}
          placeholder="Digite ou cole Markdown aqui..."
        />
      </div>

      {/* Preview */}
      <div className="flex-1">
        <h2>Preview</h2>
        <div
          className="border p-4 min-h-96 prose prose-sm"
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      </div>
    </div>
  );
}

// ============================================================
// EXEMPLO 5: Componente - Importador de Markdown
// ============================================================

export function ExemploImportadorMarkdown() {
  const handleImportMarkdown = async () => {
    const markdown = window.prompt("Cole seu Markdown:");

    if (!markdown) {
      return;
    }

    const html = renderMarkdownToHtml(markdown);
    console.log("HTML gerado:", html);
    // Aqui você aplicaria o HTML ao seu editor
  };

  return (
    <button onClick={handleImportMarkdown}>
      📥 Importar Markdown
    </button>
  );
}

// ============================================================
// EXEMPLO 6: Componente - Exportador de Markdown
// ============================================================

export function ExemploExportadorMarkdown() {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleExportMarkdown = async () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const html = editor.innerHTML;
    const markdown = htmlToMarkdown(html);

    try {
      await navigator.clipboard.writeText(markdown);
      alert("✅ Markdown copiado para clipboard!");
    } catch (error) {
      console.error("Erro ao copiar:", error);
    }
  };

  return (
    <div>
      <div ref={editorRef} contentEditable className="border p-4 min-h-96" />
      <button onClick={handleExportMarkdown}>
        📤 Copiar como Markdown
      </button>
    </div>
  );
}

// ============================================================
// EXEMPLO 7: Validação de Markdown Antes de Salvar
// ============================================================

function exemplo8ValidarAntesDeSalvar(htmlContent: string) {
  const markdown = htmlToMarkdown(htmlContent);

  // Validar se contém pelo menos um bloco Markdown
  const linhas = markdown.split("\n");
  const temMarkdown = linhas.some((linha) => isValidMarkdown(linha));

  if (!temMarkdown && markdown.trim().length > 0) {
    console.warn("Aviso: Conteúdo não parece ser Markdown válido");
  }

  return markdown;
}

// ============================================================
// EXEMPLO 8: Detectar Tipo de Bloco para UI
// ============================================================

function exemplo9DetectarParaUI() {
  const linha = "# Meu Título";
  const tipo = detectMarkdownBlock(linha);

  const icones: Record<string, string> = {
    heading: "📝",
    list: "📋",
    quote: "💬",
    code: "💻",
  };

  const icone = tipo ? icones[tipo] : "📄";
  console.log(`${icone} Tipo: ${tipo || "parágrafo"}`);
}

// ============================================================
// EXEMPLO 9: Pipeline Completo de Markdown
// ============================================================

export function exemploPipelineCompleto() {
  // 1. Usuário input
  const userMarkdown = `
# Bem-vindo

Isso é um **exemplo** completo!

- Item 1
- Item 2
  `;

  // 2. Validar
  console.assert(isValidMarkdown(userMarkdown), "Markdown inválido");

  // 3. Extrair blocos
  const blocos = extractMarkdownBlocks(userMarkdown);
  console.log("Blocos encontrados:", blocos.length);

  // 4. Renderizar
  const html = renderMarkdownToHtml(userMarkdown);

  // 5. Aplicar ao DOM
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);

  // 6. Exportar de volta
  const markdown = htmlToMarkdown(html);
  console.log("Markdown exportado:", markdown);
}

// ============================================================
// EXEMPLO 10: Tratamento de Erros
// ============================================================

function exemplo10ComTratamentoDeErro() {
  try {
    const html = renderMarkdownToHtml("# Título com **erro** não fechado");
    console.log("HTML gerado com sucesso:", html);
  } catch (error) {
    console.error("Erro ao renderizar Markdown:", error);
    // Fallback: usar texto puro
    return "<p>Erro ao processar Markdown</p>";
  }
}

// ============================================================
// EXEMPLO 11: Markdown com Sanitização Verificada
// ============================================================

function exemplo11MarkdownSeguro() {
  // ❌ Esse código malicioso será removido
  const malicious = `
# Título

<img src=x onerror="alert('XSS!')">

**Safe text**
  `;

  const html = renderMarkdownToHtml(malicious);
  // DOMPurify remove o onerror attribute automaticamente
  console.log("HTML sanitizado:", html);
}

// ============================================================
// EXPORT: Pronto para usar em seus componentes!
// ============================================================

export const exemplosMarkdown = {
  exemplo1RendererMarkdown,
  exemplo2ExportarMarkdown,
  exemplo3DetectarBloco,
  exemplo4ValidarMarkdown,
  exemplo5ExtrairBlocos,
  exemplo6ViaCommands,
  ExemploEditorComPreview,
  ExemploImportadorMarkdown,
  ExemploExportadorMarkdown,
  exemplo8ValidarAntesDeSalvar,
  exemplo9DetectarParaUI,
  exemploPipelineCompleto,
  exemplo10ComTratamentoDeErro,
  exemplo11MarkdownSeguro,
};
