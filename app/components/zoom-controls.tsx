"use client";

import { Minus, Plus, ZoomIn } from "lucide-react";
import { useState } from "react";

type ZoomControlsProps = {
  zoom: number;
  onDecrease: () => void;
  onIncrease: () => void;
};

export default function ZoomControls({
  zoom,
  onDecrease,
  onIncrease,
}: ZoomControlsProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="fixed bottom-3 right-3 z-50 sm:bottom-4 sm:left-auto sm:right-4">
      <div className="hidden items-center gap-1.5 rounded-lg border border-gray-200 bg-white/90 px-1.5 py-0.5 shadow-sm backdrop-blur-sm sm:flex">
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-gray-700 hover:bg-gray-100"
          onClick={onDecrease}
          aria-label="Diminuir zoom"
        >
          <Minus className="h-3.5 w-3.5 shrink-0" />
        </button>
        <span className="w-11 text-center text-xs font-semibold text-gray-700">
          {zoom}%
        </span>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-gray-700 hover:bg-gray-100"
          onClick={onIncrease}
          aria-label="Aumentar zoom"
        >
          <Plus className="h-3.5 w-3.5 shrink-0" />
        </button>
      </div>

      <div className="sm:hidden">
        {isMobileOpen ? (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white/95 px-2 py-1 shadow-sm backdrop-blur-sm">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-gray-700 hover:bg-gray-100"
              onClick={onDecrease}
              aria-label="Diminuir zoom"
            >
              <Minus className="h-4 w-4 shrink-0" />
            </button>
            <span className="w-14 text-center text-sm font-semibold text-gray-700">
              {zoom}%
            </span>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-gray-700 hover:bg-gray-100"
              onClick={onIncrease}
              aria-label="Aumentar zoom"
            >
              <Plus className="h-4 w-4 shrink-0" />
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-sm backdrop-blur-sm hover:bg-gray-100"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          aria-label={
            isMobileOpen ? "Fechar controle de zoom" : "Abrir controle de zoom"
          }
          aria-expanded={isMobileOpen}
        >
          <ZoomIn className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
