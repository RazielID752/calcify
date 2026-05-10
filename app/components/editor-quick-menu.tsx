"use client";

import {
  CircleHelp,
  Download,
  Files,
  GitBranch,
  Globe2,
  LogIn,
  LogOut,
  Menu,
  Save,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type EditorQuickMenuProps = {
  currentUser: { name: string; email: string } | null;
  onOpenHelp: () => void;
  onOpenDocuments: () => void;
  onSave: () => void;
  onExport: () => void;
  onImportMd: () => void;
  onOpenGithub: () => void;
  onLoginRequest: () => void;
  onLogoutRequest: () => void;
};

export default function EditorQuickMenu({
  currentUser,
  onOpenHelp,
  onOpenDocuments,
  onSave,
  onExport,
  onImportMd,
  onOpenGithub,
  onLoginRequest,
  onLogoutRequest,
}: EditorQuickMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const quickMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        quickMenuRef.current &&
        !quickMenuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleMenuAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div ref={quickMenuRef} className="fixed bottom-5 left-4 z-50 sm:left-6">
      {isOpen ? (
        <div className="mb-2 w-64 rounded-xl border border-zinc-200 bg-white/95 p-2 shadow-lg backdrop-blur">
          {currentUser ? (
            <div className="mb-2 rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-3 py-2">
              <p className="truncate text-sm font-semibold text-emerald-900">
                {currentUser.name}
              </p>
              <p className="truncate text-xs text-emerald-800/80">
                {currentUser.email}
              </p>
            </div>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-2 text-zinc-700 hover:bg-zinc-100"
            onClick={() => handleMenuAction(onOpenHelp)}
          >
            <CircleHelp className="size-4" />
            Abrir instruções
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-2 text-zinc-700 hover:bg-zinc-100"
            onClick={() => handleMenuAction(onOpenDocuments)}
          >
            <Files className="size-4" />
            Ver documentos
          </Button>

          <Button
            asChild
            variant="ghost"
            className="w-full justify-start gap-2 text-zinc-700 hover:bg-zinc-100"
          >
            <Link href="/site" onClick={() => setIsOpen(false)}>
              <Globe2 className="size-4" />
              Ir para o site
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-2 text-zinc-700 hover:bg-zinc-100"
            onClick={() => handleMenuAction(onSave)}
          >
            <Save className="size-4" />
            Salvar
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-2 text-zinc-700 hover:bg-zinc-100"
            onClick={() => handleMenuAction(onExport)}
          >
            <Download className="size-4" />
            Exportar (.md)
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-2 text-zinc-700 hover:bg-zinc-100"
            onClick={() => handleMenuAction(onImportMd)}
          >
            <Upload className="size-4" />
            Importar (.md)
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-2 text-zinc-700 hover:bg-zinc-100"
            onClick={() => handleMenuAction(onOpenGithub)}
          >
            <GitBranch className="size-4" />
            Levar para o GitHub
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-2 text-zinc-700 hover:bg-zinc-100"
            onClick={() =>
              handleMenuAction(currentUser ? onLogoutRequest : onLoginRequest)
            }
          >
            {currentUser ? (
              <LogOut className="size-4" />
            ) : (
              <LogIn className="size-4" />
            )}
            {currentUser ? "Sair" : "Login"}
          </Button>
        </div>
      ) : null}

      <Button
        type="button"
        size="icon-lg"
        className="rounded-full border border-zinc-200 bg-white/95 text-emerald-600 shadow-sm backdrop-blur-sm hover:border-emerald-300 hover:bg-emerald-500 hover:text-white"
        aria-label={isOpen ? "Fechar menu flutuante" : "Abrir menu flutuante"}
        title={isOpen ? "Fechar menu" : "Abrir menu"}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>
    </div>
  );
}
