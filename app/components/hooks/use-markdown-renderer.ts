"use client";

import { useCallback, useRef } from "react";
import {
  detectMarkdownBlock,
  extractMarkdownBlocks,
  renderMarkdownToHtml,
} from "@/utils/markdown-utils";

type UseMarkdownRendererParams = {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onHtmlChange: (html: string) => void;
  debounceMs?: number;
};

/**
 * Hook para gerenciar renderização de Markdown com debounce
 * Monitora mudanças no editor e renderiza Markdown automaticamente
 */
export function useMarkdownRenderer({
  editorRef,
  onHtmlChange,
  debounceMs = 500,
}: UseMarkdownRendererParams) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRenderingRef = useRef(false);

  /**
   * Renderiza conteúdo que parece ser Markdown puro
   * Detecta blocos de Markdown e converte para HTML
   */
  const renderMarkdownContent = useCallback(() => {
    const editor = editorRef.current;

    if (!editor || isRenderingRef.current) {
      return;
    }

    const content = editor.innerText;

    if (!content.trim()) {
      return;
    }

    const lines = content.split("\n");
    const hasMarkdownIndicators = lines.some(
      (line) => detectMarkdownBlock(line) !== null,
    );

    // Se não parece Markdown, não renderiza
    if (!hasMarkdownIndicators) {
      return;
    }

    // Renderiza todo o conteúdo como Markdown
    isRenderingRef.current = true;

    try {
      const html = renderMarkdownToHtml(content);
      onHtmlChange(html);
    } catch (error) {
      console.error("Erro ao renderizar Markdown:", error);
    } finally {
      isRenderingRef.current = false;
    }
  }, [editorRef, onHtmlChange]);

  /**
   * Versão debounced de renderMarkdownContent
   */
  const debouncedRenderMarkdown = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      renderMarkdownContent();
      debounceTimerRef.current = null;
    }, debounceMs);
  }, [renderMarkdownContent, debounceMs]);

  /**
   * Renderiza conteúdo colado (pasted)
   * Se o conteúdo parece Markdown, renderiza imediatamente
   */
  const handlePastedMarkdown = useCallback(
    (text: string) => {
      const lines = extractMarkdownBlocks(text);
      const hasMarkdownIndicators = lines.some(
        (line) => detectMarkdownBlock(line) !== null,
      );

      if (hasMarkdownIndicators) {
        try {
          const html = renderMarkdownToHtml(text);
          onHtmlChange(html);
        } catch (error) {
          console.error("Erro ao renderizar Markdown colado:", error);
        }
      }
    },
    [onHtmlChange],
  );

  /**
   * Força renderização imediata
   */
  const forceRender = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    renderMarkdownContent();
  }, [renderMarkdownContent]);

  /**
   * Limpa o timer ao desmontar
   */
  const cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    debouncedRenderMarkdown,
    handlePastedMarkdown,
    forceRender,
    cleanup,
  };
}
