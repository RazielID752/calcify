#!/bin/bash
# Script para fazer commit da implementação de Markdown

# ============================================================
# COMANDOS GIT PARA FAZER COMMIT
# ============================================================

# 1. Verificar status
echo "📊 Status do git:"
git status

# 2. Adicionar os arquivos criados
echo "📝 Adicionando arquivos novos..."
git add utils/markdown-utils.ts
git add app/components/hooks/use-markdown-renderer.ts
git add MARKDOWN_GUIDE.md
git add IMPLEMENTATION_SUMMARY.md
git add EXEMPLOS_MARKDOWN.md
git add IMPLEMENTATION_CHECKLIST.md

# 3. Adicionar arquivos modificados
echo "🔄 Adicionando arquivos modificados..."
git add app/components/editor-commands.ts

# 4. Ver o que será commitado
echo "✅ Mudanças a serem commitadas:"
git diff --cached --stat

# 5. Fazer o commit
echo "💾 Fazendo commit..."
git commit -m "feat: implementar suporte completo a Markdown no editor

- Criar utils/markdown-utils.ts com funções centralizadas
  - renderMarkdownToHtml(): Markdown → HTML sanitizado
  - htmlToMarkdown(): HTML → Markdown
  - detectMarkdownBlock(): Detecta tipo de bloco
  - isValidMarkdown(): Valida Markdown
  - extractMarkdownBlocks(): Extrai blocos múltiplas linhas
  - applyInlineMarkdown(): Formatação inline

- Criar hooks/use-markdown-renderer.ts para render com debounce
  - debouncedRenderMarkdown(): Render com delay
  - handlePastedMarkdown(): Detecta conteúdo colado
  - forceRender(): Renderização imediata

- Refatorar editor-commands.ts
  - Usar funções centralizadas
  - Manter compatibilidade 100%

- Adicionar documentação completa
  - MARKDOWN_GUIDE.md: Guia de arquitetura e uso
  - IMPLEMENTATION_SUMMARY.md: Resumo executivo
  - EXEMPLOS_MARKDOWN.md: 11 exemplos práticos
  - IMPLEMENTATION_CHECKLIST.md: Checklist de testes

- Verificações técnicas
  - ✅ TypeScript: Sem erros
  - ✅ Biome: 10 arquivos formatados
  - ✅ Dependências: Todas instaladas

Closes #markdown-support"

# 6. Verificar o commit
echo "📋 Commit criado:"
git log -1

# ============================================================
# FIM DO SCRIPT
# ============================================================
