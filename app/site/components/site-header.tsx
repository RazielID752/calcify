import { ArrowRight, SquarePen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { navItems } from "./site-data";
import Image from "next/image";
import logo from "@/assets/logo.svg";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/site" className="flex items-center gap-2 font-semibold">
          <Image src={logo} alt="Calcify" className="size-20" />
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-zinc-600 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-zinc-950">
              {item.label}
            </a>
          ))}
        </nav>

        <Button asChild size="sm" className="gap-2 bg-zinc-950 text-white">
          <Link href="/">
            Abrir editor
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
