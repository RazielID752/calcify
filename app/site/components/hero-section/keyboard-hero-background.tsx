"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";

const keyboardRows = [
  ["esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "delete"],
  ["tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
  ["caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "return"],
  [
    "left-shift",
    "Z",
    "X",
    "C",
    "V",
    "B",
    "N",
    "M",
    ",",
    ".",
    "/",
    "right-shift",
  ],
  [
    "fn",
    "ctrl",
    "left-opt",
    "left-cmd",
    "space",
    "right-cmd",
    "right-opt",
    "←",
    "↑",
    "↓",
    "→",
  ],
];

const wideKeys = new Map([
  ["delete", 2],
  ["tab", 2],
  ["caps", 2],
  ["return", 2],
  ["shift", 3],
  ["space", 6],
]);

const typingKeys = new Map(
  [
    "fn",
    "tab",
    "caps",
    "shift",
    "ctrl",
    "alt",
    "C",
    "A",
    "L",
    "I",
    "F",
    "Y",
    "space",
    "1",
    "2",
    "0",
    "return",
  ].map((key, index) => [key, index]),
);

const getKeyLabel = (key: string) =>
  key.replace("left-", "").replace("right-", "");

const getKeySpan = (key: string) => wideKeys.get(getKeyLabel(key)) ?? 1;

const getKeyboardKeyFromEvent = (event: KeyboardEvent) => {
  const specialKeys = new Map([
    ["Escape", "esc"],
    ["Backspace", "delete"],
    ["Tab", "tab"],
    ["Enter", "return"],
    [" ", "space"],
    ["ArrowLeft", "←"],
    ["ArrowUp", "↑"],
    ["ArrowDown", "↓"],
    ["ArrowRight", "→"],
  ]);

  if (event.code === "ShiftLeft") {
    return "left-shift";
  }

  if (event.code === "ShiftRight") {
    return "right-shift";
  }

  if (event.code === "MetaLeft") {
    return "left-cmd";
  }

  if (event.code === "MetaRight") {
    return "right-cmd";
  }

  if (event.code === "AltLeft") {
    return "left-opt";
  }

  if (event.code === "AltRight") {
    return "right-opt";
  }

  if (event.code === "ControlLeft" || event.code === "ControlRight") {
    return "ctrl";
  }

  const specialKey = specialKeys.get(event.key);

  if (specialKey) {
    return specialKey;
  }

  if (event.key.length === 1) {
    return event.key.toUpperCase();
  }

  return null;
};

export default function KeyboardHeroBackground() {
  const activeKeyTimersRef = useRef(new Map<string, number>());
  const keyElementsRef = useRef(new Map<string, HTMLDivElement>());

  const registerKeyElement = (key: string, label: string) => {
    return (element: HTMLDivElement | null) => {
      if (!element) {
        keyElementsRef.current.delete(key);
        keyElementsRef.current.delete(label);
        return;
      }

      keyElementsRef.current.set(key, element);
      keyElementsRef.current.set(label, element);
    };
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const nextKey = getKeyboardKeyFromEvent(event);

      if (!nextKey) {
        return;
      }

      const existingTimer = activeKeyTimersRef.current.get(nextKey);

      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      const keyElement = keyElementsRef.current.get(nextKey);

      if (!keyElement) {
        return;
      }

      keyElement.classList.remove("calcify-key-live");
      keyElement.offsetHeight;
      keyElement.classList.add("calcify-key-live");

      const timerId = window.setTimeout(() => {
        activeKeyTimersRef.current.delete(nextKey);
        keyElement.classList.remove("calcify-key-live");
      }, 130);

      activeKeyTimersRef.current.set(nextKey, timerId);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      for (const timerId of activeKeyTimersRef.current.values()) {
        window.clearTimeout(timerId);
      }

      activeKeyTimersRef.current.clear();
      keyElementsRef.current.clear();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="group pointer-events-auto absolute inset-x-1/2 top-0 h-full w-[178vw] min-w-370 -translate-x-1/2 overflow-hidden opacity-50"
    >
      <div className="absolute inset-x-0 top-0 mx-auto max-w-410 px-6 pt-6">
        <div className="calcify-keyboard-plane space-y-3 rounded-[34px] border border-zinc-900/5 bg-white/25 p-4 shadow-[0_30px_120px_-80px_rgba(24,24,27,0.45)] backdrop-blur-[2px] transition-colors duration-500 group-hover:border-emerald-400/25">
          {keyboardRows.map((row, rowIndex) => (
            <div
              key={`row-${row.join("-")}`}
              className="grid grid-cols-16 gap-3"
              style={
                {
                  "--calcify-row-delay": `${rowIndex * 90}ms`,
                } as CSSProperties
              }
            >
              {row.map((key, keyIndex) => {
                const label = getKeyLabel(key);
                const span = getKeySpan(key);
                const typingIndex = typingKeys.get(key);
                const isTypingKey = typingIndex !== undefined;

                return (
                  <div
                    key={key}
                    className={`flex h-16 items-center justify-center rounded-lg border border-zinc-900/10 bg-white/58 px-3 text-xs font-medium tracking-[0.16em] text-zinc-500 uppercase shadow-[inset_0_-1px_0_rgba(24,24,27,0.08),0_10px_30px_-24px_rgba(24,24,27,0.6)] transition-colors duration-500 group-hover:border-emerald-400/35 group-hover:text-emerald-800 sm:h-20 ${
                      isTypingKey ? "calcify-key-typing" : "calcify-key-idle"
                    }`}
                    ref={registerKeyElement(key, label)}
                    style={
                      {
                        gridColumn: `span ${span}`,
                        "--calcify-delay": isTypingKey
                          ? `${typingIndex * 170}ms`
                          : `${rowIndex * 120 + keyIndex * 22}ms`,
                      } as CSSProperties
                    }
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}