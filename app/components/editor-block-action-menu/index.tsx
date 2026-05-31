"use client";

import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Sigma,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export type EditorBlockAction =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "orderedList"
  | "blockquote"
  | "codeBlock"
  | "image"
  | "calculation";

type EditorBlockActionMenuProps = {
  top: number;
  onAction: (action: EditorBlockAction) => void;
  onClose: (target?: EventTarget | null) => void;
};

const MENU_TOP_OFFSET_PX = 48;

const blockActions: Array<{
  id: EditorBlockAction;
  label: string;
  icon: typeof Pilcrow;
}> = [
  {
    id: "paragraph",
    label: "Texto",
    icon: Pilcrow,
  },
  {
    id: "heading1",
    label: "Título 1",
    icon: Heading1,
  },
  {
    id: "heading2",
    label: "Título 2",
    icon: Heading2,
  },
  {
    id: "heading3",
    label: "Título 3",
    icon: Heading3,
  },
  {
    id: "bulletList",
    label: "Lista",
    icon: List,
  },
  {
    id: "orderedList",
    label: "Lista numerada",
    icon: ListOrdered,
  },
  {
    id: "blockquote",
    label: "Citação",
    icon: Quote,
  },
  {
    id: "codeBlock",
    label: "Código",
    icon: Code,
  },
  {
    id: "image",
    label: "Imagem",
    icon: ImagePlus,
  },
  {
    id: "calculation",
    label: "Cálculo",
    icon: Sigma,
  },
];

export default function EditorBlockActionMenu({
  top,
  onAction,
  onClose,
}: EditorBlockActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose(event.target);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute left-0 z-30 w-64 -translate-x-2 rounded-xl border border-zinc-200 bg-white/95 p-1.5 shadow-lg backdrop-blur"
      style={{ top: `${top + MENU_TOP_OFFSET_PX}px` }}
    >
      <div className="grid grid-cols-2 gap-1">
        {blockActions.map((action) => {
          const Icon = action.icon;

          return (
            <Button
              type="button"
              variant="ghost"
              className="h-8 justify-start gap-1.5 px-2 text-left text-xs hover:bg-emerald-50 hover:text-emerald-800"
              key={action.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onAction(action.id)}
            >
              <Icon className="size-3.5 shrink-0 text-zinc-500" />
              <span className="min-w-0 truncate">{action.label}</span>
            </Button>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-zinc-100 px-1.5 pt-1.5 pb-0.5 text-xs text-zinc-500">
        <span>Fechar command</span>
        <kbd className="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-medium text-zinc-600">
          Esc
        </kbd>
      </div>
    </div>
  );
}
