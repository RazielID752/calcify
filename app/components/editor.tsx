"use client";

import { Copy, Eraser, Sigma } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { calculateLines } from "@/utils/calculate";
import ZoomControls from "./zoom-controls";

export default function Editor() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [zoom, setZoom] = useState(100);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fontSizePx = (16 * zoom) / 100;
  const lineHeightPx = (24 * zoom) / 100;

  const increaseZoom = () => {
    setZoom((currentZoom) => Math.min(200, currentZoom + 10));
  };

  const decreaseZoom = () => {
    setZoom((currentZoom) => Math.max(70, currentZoom - 10));
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const calculated = calculateLines(text);
      setResults(calculated);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [text]);

  useEffect(() => {
    const savedText = localStorage.getItem("calculatorText");

    if (savedText) {
      setText(savedText);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("calculatorText", text);
  }, [text]);

  const insertAtCursor = (value: string) => {
    const textarea = textareaRef.current;

    if (!textarea) {
      setText((currentText) => `${currentText}${value}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextText = `${text.slice(0, start)}${value}${text.slice(end)}`;

    setText(nextText);

    const cursorPosition = start + value.length;

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const copyAll = async () => {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API can fail if browser permissions are denied.
    }
  };

  const insertWrappedSelection = (left: string, right = left) => {
    const textarea = textareaRef.current;

    if (!textarea) {
      setText((currentText) => `${currentText}${left}${right}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.slice(start, end);
    const nextText = `${text.slice(0, start)}${left}${selectedText}${right}${text.slice(end)}`;

    setText(nextText);

    requestAnimationFrame(() => {
      textarea.focus();

      if (selectedText) {
        const afterSelection = start + left.length + selectedText.length + right.length;
        textarea.setSelectionRange(afterSelection, afterSelection);
        return;
      }

      const cursor = start + left.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const extractResult = (inputLine: string, calculatedLine: string) => {
    if (calculatedLine.trim() === inputLine.trim()) {
      return "";
    }

    const separator = " = ";
    const separatorIndex = calculatedLine.lastIndexOf(separator);

    if (separatorIndex === -1) {
      return "";
    }

    return calculatedLine.slice(separatorIndex + separator.length);
  };

  const lines = text.split("\n");
  let lineStart = 0;

  return (
    <div className="relative h-screen bg-white">
      <div className="absolute left-1/2 top-4 z-20 w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2">
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white/95 p-1.5 shadow-sm backdrop-blur-sm">
          <div className="flex min-w-max items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                onClick={() => insertAtCursor(" = ")}
                title="Inserir igual"
              >
                =
              </button>
              <button
                type="button"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                onClick={() => insertAtCursor("pi")}
                title="Inserir pi"
              >
                pi
              </button>
              <button
                type="button"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                onClick={() => insertAtCursor("e")}
                title="Inserir e"
              >
                e
              </button>
            </div>

            <div className="h-6 w-px bg-zinc-200" />

            <div className="flex items-center gap-1">
              {[
                { label: "+", value: " + " },
                { label: "-", value: " - " },
                { label: "*", value: " * " },
                { label: "/", value: " / " },
                { label: "%", value: " % " },
                { label: "^", value: " ^ " },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  onClick={() => insertAtCursor(item.value)}
                  title={`Inserir ${item.label}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-zinc-200" />

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                onClick={() => insertWrappedSelection("(", ")")}
                title="Envolver em parênteses"
              >
                ()
              </button>
              <button
                type="button"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                onClick={() => insertWrappedSelection("[", "]")}
                title="Envolver em colchetes"
              >
                []
              </button>
              <button
                type="button"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                onClick={() => insertAtCursor("sqrt()")}
                title="Inserir raiz"
              >
                <Sigma className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                onClick={() => insertAtCursor("abs()")}
                title="Inserir abs"
              >
                abs
              </button>
              <button
                type="button"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                onClick={() => insertAtCursor("pow(,)")}
                title="Inserir pow"
              >
                pow
              </button>
            </div>

            <div className="h-6 w-px bg-zinc-200" />

            <div className="flex items-center gap-1">
              {[
                "round()",
                "floor()",
                "ceil()",
                "min(,)",
                "max(,)",
                "sin()",
                "cos()",
                "tan()",
                "log()",
              ].map((fnName) => (
                <button
                  key={fnName}
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-md px-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  onClick={() => insertAtCursor(fnName)}
                  title={`Inserir ${fnName}`}
                >
                  {fnName}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-zinc-200" />

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-700 transition hover:bg-zinc-100"
                onClick={() => setText("")}
                aria-label="Limpar editor"
                title="Limpar"
              >
                <Eraser className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-700 transition hover:bg-zinc-100"
                onClick={copyAll}
                aria-label="Copiar texto"
                title="Copiar"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex justify-center px-3 pb-6 pt-20 sm:px-6 sm:pt-24">
        <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_14px_40px_rgba(20,20,20,0.08)]">
          <textarea
            ref={textareaRef}
            className="h-full w-full resize-none p-8 pr-48 outline-none font-mono"
            style={{ fontSize: `${fontSizePx}px`, lineHeight: `${lineHeightPx}px` }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            wrap="off"
            onScroll={(e) => {
              setScrollTop(e.currentTarget.scrollTop);
              setScrollLeft(e.currentTarget.scrollLeft);
            }}
            placeholder="Digite seus cálculos..."
          />

          <div
            className="pointer-events-none absolute inset-0 overflow-hidden p-8 font-mono"
            aria-hidden
            style={{ fontSize: `${fontSizePx}px`, lineHeight: `${lineHeightPx}px` }}
          >
            <div
              style={{ transform: `translate(${-scrollLeft}px, ${-scrollTop}px)` }}
            >
              {lines.map((inputLine, index) => {
                const result = extractResult(inputLine, results[index] ?? "");
                const lineKey = `${lineStart}-${inputLine}`;
                lineStart += inputLine.length + 1;

                return (
                  <div
                    key={lineKey}
                    className="whitespace-pre"
                    style={{ height: `${lineHeightPx}px` }}
                  >
                    {result ? (
                      <>
                        <span className="invisible">{inputLine}</span>
                        <span className="font-bold text-green-600">
                          {" "}
                          = {result}
                        </span>
                      </>
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ZoomControls
        zoom={zoom}
        onDecrease={decreaseZoom}
        onIncrease={increaseZoom}
      />
    </div>
  );
}
