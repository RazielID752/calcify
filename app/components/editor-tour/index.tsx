"use client";

import { useEffect, useRef, useState } from "react";
import { type EventData, Joyride, STATUS, type Step } from "react-joyride";

const EDITOR_TOUR_STORAGE_KEY = "calcify_editor_tour_seen_v1";

const editorTourSteps: Step[] = [
  {
    target: "[data-tour='document-tabs']",
    title: "Documentos em abas",
    content:
      "Cada aba representa um documento. Você pode alternar, renomear, fechar e criar novos documentos sem sair do editor.",
    placement: "bottom",
  },
  {
    target: "[data-tour='create-document']",
    title: "Criar documento",
    content:
      "Use este botão para começar em branco ou escolher um modelo pronto, como orçamento, reunião, projeto e briefing.",
    placement: "left",
  },
  {
    target: "[data-tour='formatting-toolbar']",
    title: "Formatação",
    content:
      "Aqui ficam títulos, listas, citação, código, link, imagem e controles de texto. É a régua rápida do documento.",
    placement: "bottom",
  },
  {
    target: "[data-tour='math-tools']",
    title: "Cálculos no texto",
    content:
      "O Calcify resolve expressões no próprio documento. Você pode escrever contas e usar o menu Math para inserir funções.",
    placement: "bottom",
  },
  {
    target: "[data-tour='writing-surface']",
    title: "Área de escrita",
    content:
      "Escreva como em uma nota. Markdown, títulos, listas e cálculos são organizados automaticamente enquanto você trabalha.",
    placement: "center",
  },
  {
    target: "[data-tour='quick-menu']",
    title: "Menu principal",
    content:
      "Neste menu você acessa documentos, exportação, PDF, compartilhamento, login e instruções.",
    placement: "right",
  },
];

type EditorTourProps = {
  restartSignal: number;
};

const blurActiveElement = () => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

export default function EditorTour({ restartSignal }: EditorTourProps) {
  const [runTour, setRunTour] = useState(false);
  const previousRestartSignalRef = useRef(restartSignal);

  useEffect(() => {
    const hasSeenTour =
      localStorage.getItem(EDITOR_TOUR_STORAGE_KEY) === "true";

    if (!hasSeenTour) {
      const startTourTimer = window.setTimeout(() => {
        blurActiveElement();
        setRunTour(false);
        window.setTimeout(() => setRunTour(true), 0);
      }, 600);

      return () => window.clearTimeout(startTourTimer);
    }
  }, []);

  useEffect(() => {
    if (restartSignal === previousRestartSignalRef.current) {
      return;
    }

    previousRestartSignalRef.current = restartSignal;
    localStorage.removeItem(EDITOR_TOUR_STORAGE_KEY);
    blurActiveElement();
    setRunTour(false);
    window.setTimeout(() => setRunTour(true), 0);
  }, [restartSignal]);

  const handleTourEvent = (event: EventData) => {
    if (event.status !== STATUS.FINISHED && event.status !== STATUS.SKIPPED) {
      return;
    }

    localStorage.setItem(EDITOR_TOUR_STORAGE_KEY, "true");
    setRunTour(false);
  };

  return (
    <Joyride
      continuous
      run={runTour}
      scrollToFirstStep
      steps={editorTourSteps}
      onEvent={handleTourEvent}
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Concluir",
        next: "Próximo",
        nextWithProgress: "Próximo ({current} de {total})",
        open: "Abrir tutorial",
        skip: "Pular",
      }}
      options={{
        backgroundColor: "#ffffff",
        scrollOffset: 120,
        overlayColor: "rgba(24, 24, 27, 0.48)",
        primaryColor: "#059669",
        showProgress: true,
        spotlightRadius: 8,
        textColor: "#18181b",
        width: 360,
        zIndex: 80,
      }}
    />
  );
}
