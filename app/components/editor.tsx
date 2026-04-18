"use client";

import { useEffect, useState } from "react";
import { calculateLines } from "@/utils/calculate";
import ZoomControls from "./zoom-controls";

export default function Editor() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [zoom, setZoom] = useState(100);

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
    localStorage.setItem("calculatorText", text);
  }, [text]);

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

  return (
    <div className="relative h-screen">
      <textarea
        className="h-full w-full resize-none p-4 pr-48 outline-none font-mono"
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
        className="pointer-events-none absolute inset-0 overflow-hidden p-4 font-mono"
        aria-hidden
        style={{ fontSize: `${fontSizePx}px`, lineHeight: `${lineHeightPx}px` }}
      >
        <div
          style={{ transform: `translate(${-scrollLeft}px, ${-scrollTop}px)` }}
        >
          {lines.map((inputLine, index) => {
            const result = extractResult(inputLine, results[index] ?? "");

            return (
              <div
                key={index}
                className="whitespace-pre"
                style={{ height: `${lineHeightPx}px` }}
              >
                {result ? (
                  <>
                    <span className="invisible">{inputLine}</span>
                    <span className="font-bold text-green-600"> = {result}</span>
                  </>
                ) : (
                  <span>&nbsp;</span>
                )}
              </div>
            );
          })}
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