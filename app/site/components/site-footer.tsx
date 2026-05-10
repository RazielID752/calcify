import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.svg";

export default function SiteFooter() {
  return (
    <footer className="border-zinc-200 border-t bg-[#fbfbf8]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Image src={logo} alt="Calcify" className="size-16" />
          <span className="font-medium text-black">| © 2026 Calcify. Editor de notas que calculam.</span>
        </div>
        <div className="flex gap-5">
          <Link href="/" className="hover:text-zinc-950">
            Editor
          </Link>
          <a href="#recursos" className="hover:text-zinc-950">
            Recursos
          </a>
          <a href="#sync" className="hover:text-zinc-950">
            Sync
          </a>
        </div>
      </div>
    </footer>
  );
}
