# Guia de Arquitetura Markdown - Calcify Editor

## 📋 Overview

O editor Calcify agora possui suporte completo a Markdown com uma arquitetura escalável e bem separada em camadas.

## 🏗️ Arquitetura

### Camadas (Separation of Concerns)

```
┌─────────────────────────────────────────┐
│      React Component (editor.tsx)       │
│  - Gerencia estado e UI                 │
│  - Coordena os eventos                  │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │   Hooks         │
        │ ─────────────── │
        │ useEditor       │
        │ useAutoTrans    │
        │ useMarkdown     │
        └────────┬────────┘
                 │
        ┌────────▼────────────────┐
        │  Commands               │
        │ ──────────────────────  │
        │ editor-commands.ts      │
        │ - heading()             │
        │ - list()                │
        │ - markdownToHtml()      │
        └────────┬────────────────┘
                 │
        ┌────────▼────────────────┐
        │  Utilities              │
        │ ──────────────────────  │
        │ markdown-utils.ts       │
        │ - renderMarkdownToHtml()│
        │ - htmlToMarkdown()      │
        │ - detectMarkdownBlock() │
        │ - isValidMarkdown()     │
        └────────┬────────────────┘
                 │
        ┌────────▼────────────────┐
        │  External Libraries     │
        │ ──────────────────────  │
        │ - marked (parsing)      │
        │ - dompurify (sanitize)  │
        │ - turndown (convert)    │
        └────────────────────────┘
```

## 📁 Estrutura de Arquivos

```
app/components/
├── editor.tsx                    # Componente principal
├── editor-commands.ts            # Comandos de editor
├── editor-toolbar.tsx            # Toolbar
├── hooks/
│   ├── use-editor-session.ts    # Estado de sessão
│   ├── use-auto-transforms.ts   # Transformações automáticas (padrões simples)
│   └── use-markdown-renderer.ts # ✨ Novo: Render de Markdown com debounce
└── zoom-controls.tsx             # Controle de zoom

utils/
├── render-markdown.ts            # (Mantém compatibilidade)
├── markdown-utils.ts             # ✨ Novo: Utilitários centralizados
└── calculate.ts                  # Cálculos inline
```

## 🔧 Como Funciona

### 1. Detecção Automática de Markdown (Padrões Simples)

Ao digitar um espaço após padrões de Markdown, o editor converte automaticamente:

```markdown
# Texto   → <h1>Texto</h1>
- Item   → <ul><li>Item</li></ul>
> Quote  → <blockquote>Quote</blockquote>
```

**Arquivo:** `hooks/use-auto-transforms.ts`

### 2. Renderização de Markdown Completo

Quando você colar ou importar Markdown, todo o conteúdo é renderizado:

```markdown
# Título
**bold** e *italic*
- item 1
- item 2

Parágrafo normal
```

**Fluxo:**
1. Markdown é parseado pela biblioteca `marked`
2. HTML é sanitizado por `dompurify`
3. Conteúdo é renderizado no editor

**Arquivo:** `utils/markdown-utils.ts`

### 3. Exportação de Markdown

Quando você quer copiar o conteúdo como Markdown, ele é convertido de HTML:

```tsx
const markdown = editorCommands.htmlToMarkdown(editor.innerHTML);
```

**Arquivo:** `utils/markdown-utils.ts` + `turndown`

## 🎯 Casos de Uso

### Caso 1: Digitar Markdown Simples
```
Usuário digita: "# Título"
Ao digitar espaço após #: Converte para <h1>
```

### Caso 2: Colar Markdown Completo
```
Usuário cola:
# Título
**bold**
- item

Resultado: Todo o conteúdo é renderizado como HTML
```

### Caso 3: Importar/Renderizar Markdown via Modal
```tsx
const markdown = window.prompt("Cole seu Markdown:");
const html = editorCommands.markdownToHtml(markdown);
applyExternalHtml(html);
```

### Caso 4: Exportar como Markdown
```tsx
const markdown = editorCommands.htmlToMarkdown(editor.innerHTML);
navigator.clipboard.writeText(markdown);
```

## 🚀 Usando as Funções Utilitárias

### Em Componentes React

```tsx
import { renderMarkdownToHtml, htmlToMarkdown } from "@/utils/markdown-utils";

// Renderizar Markdown
const html = renderMarkdownToHtml("# Hello\n**Bold**");

// Converter HTML para Markdown
const md = htmlToMarkdown("<h1>Hello</h1><strong>Bold</strong>");

// Detectar tipo de bloco
import { detectMarkdownBlock } from "@/utils/markdown-utils";
const type = detectMarkdownBlock("# Título"); // "heading"
```

### No Hook de Render

```tsx
import { useMarkdownRenderer } from "@/components/hooks/use-markdown-renderer";

const { debouncedRenderMarkdown, handlePastedMarkdown, forceRender } = 
  useMarkdownRenderer({
    editorRef,
    onHtmlChange: (html) => applyExternalHtml(html),
    debounceMs: 500,
  });

// Renderizar com debounce ao digitar
onInput={() => debouncedRenderMarkdown()}

// Renderizar conteúdo colado
onPaste={(e) => handlePastedMarkdown(e.clipboardData.getData("text/plain"))}
```

## 📝 Referência de Funções

### `markdown-utils.ts`

| Função | Entrada | Saída | Descrição |
|--------|---------|-------|-----------|
| `renderMarkdownToHtml()` | `string` (Markdown) | `string` (HTML) | Converte Markdown → HTML sanitizado |
| `htmlToMarkdown()` | `string` (HTML) | `string` (Markdown) | Converte HTML → Markdown |
| `detectMarkdownBlock()` | `string` (linha) | `"heading" \| "list" \| "quote" \| "code" \| null` | Detecta tipo de bloco |
| `isValidMarkdown()` | `string` | `boolean` | Verifica se é Markdown válido |
| `extractMarkdownBlocks()` | `string` (multilinhas) | `string[]` | Extrai blocos individuais |
| `applyInlineMarkdown()` | `string` | `string` | Aplica formatação inline |

### `use-markdown-renderer.ts`

| Hook | Parâmetros | Retorno | Descrição |
|------|-----------|---------|-----------|
| `useMarkdownRenderer()` | `{ editorRef, onHtmlChange, debounceMs }` | `{ debouncedRenderMarkdown, handlePastedMarkdown, forceRender, cleanup }` | Gerencia render com debounce |

## 🔐 Segurança

Todas as conversões de Markdown passam por sanitização com `dompurify`:

```tsx
const html = marked.parse(markdown);
const safe = DOMPurify.sanitize(html); // Remove scripts e tags perigosas
```

## ⚡ Performance

### Debouncing

O render de Markdown é debounced por padrão (500ms) para evitar re-renders frequentes:

```tsx
// Ao digitar, não renderiza a cada caractere
// Aguarda 500ms após a última mudança
debouncedRenderMarkdown();
```

### Memoização

Hooks usam `useCallback` para evitar re-renders desnecessários.

## 🧪 Testando

### Teste Padrões Simples
1. Digite `# Título ` (com espaço)
2. Veja transformar em `<h1>Título</h1>`

### Teste Markdown Completo
1. Cole este Markdown:
```markdown
# Meu Título
**Negrito** e *itálico*
- Item 1
- Item 2

> Citação aqui
```

2. Veja todo o conteúdo ser renderizado

### Teste Exportação
1. Clique em "Copy Markdown"
2. Cole em editor de texto
3. Veja resultado em Markdown

## 🐛 Debug

Se Markdown não está sendo renderizado:

1. Verifique se é Markdown válido: `isValidMarkdown(text)`
2. Teste render direto: `renderMarkdownToHtml(text)`
3. Verifique sanitização: `DOMPurify.sanitize(html)`

## 📚 Referências

- [Marked Documentation](https://marked.js.org/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Turndown Documentation](https://github.com/domchristie/turndown)

## 🔄 Mantendo a Compatibilidade

O sistema foi projetado para ser totalmente retrocompatível:

- ✅ Padrões simples continuam funcionando (auto transforms)
- ✅ Funções antigas não foram removidas
- ✅ Nova lógica é aditiva, não substitutiva
- ✅ Pode ser ativado/desativado facilmente

## 📈 Próximas Melhorias

- [ ] Preview de Markdown em tempo real
- [ ] Suporte a tabelas
- [ ] Suporte a emojis
- [ ] Syntax highlighting para código
- [ ] Suporte a links automáticos
