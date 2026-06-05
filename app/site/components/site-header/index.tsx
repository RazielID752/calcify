"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import icon from "@/assets/icon-big.png";
import { navItems } from "../site-data";

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-zinc-200/70 border-b bg-white/95 backdrop-blur-2xl">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold text-zinc-950"
          aria-label="Calcify"
          onClick={() => setIsMenuOpen(false)}
        >
          <Image
            src={icon}
            alt=""
            className="size-9 rounded-[10px] shadow-sm shadow-zinc-950/10"
          />
          <span className="hidden text-sm tracking-normal sm:inline">
            Calcify
          </span>
        </Link>

        <nav className="-translate-x-1/2 absolute left-1/2 hidden items-center gap-8 text-sm font-medium text-zinc-500 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-zinc-950"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <Link
            href="/editor"
            className="hidden h-9 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm shadow-zinc-950/10 transition-colors hover:bg-zinc-800 sm:inline-flex"
          >
            Abrir editor
            <ArrowRight className="size-4" />
          </Link>

          <button
            type="button"
            aria-label={isMenuOpen ? "Fechar navegação" : "Abrir navegação"}
            aria-expanded={isMenuOpen}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 shadow-sm shadow-zinc-950/5 transition-colors hover:bg-zinc-100 md:hidden"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            {isMenuOpen ? (
              <X className="size-4" />
            ) : (
              <Menu className="size-4" />
            )}
            Menu
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden border-zinc-200/70 border-t bg-white/95 transition-[max-height,opacity] duration-200 md:hidden ${
          isMenuOpen ? "max-h-90 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto grid max-w-7xl gap-1 px-4 py-3 sm:px-6">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/editor"
            className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            onClick={() => setIsMenuOpen(false)}
          >
            Abrir editor
            <ArrowRight className="size-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
