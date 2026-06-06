import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import icon from "@/assets/icon-big.png";
import { navItems } from "../site-data";

const productMarks = ["Markdown", "Cálculos", "Conversões", "Biblioteca"];

const productLinks = navItems.filter((item) =>
  ["#recursos", "#produto", "#diferencial"].includes(item.href),
);

const platformLinks = [
  { label: "Editor", href: "/editor" },
  ...navItems.filter((item) =>
    ["#fluxo", "#plano", "#download"].includes(item.href),
  ),
];

const legalLinks = [{ label: "Privacidade", href: "/privacidade" }];

const footerColumns = [
  { title: "Produto", links: productLinks },
  { title: "Plataforma", links: platformLinks },
  { title: "Legal", links: legalLinks },
];

export default function SiteFooter() {
  return (
    <footer className="border-zinc-200 border-t bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-start">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image
                src={icon}
                alt="Calcify"
                className="size-16 rounded-2xl shadow-lg shadow-black/30"
              />
            </Link>

            <p className="mt-5 max-w-md text-base leading-7 text-zinc-300">
              Um editor limpo para escrever, calcular, converter e transformar
              anotações em documentos úteis sem sair do fluxo.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {productMarks.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h2 className="text-sm font-semibold text-white">
                  {column.title}
                </h2>
                <nav className="mt-4 grid gap-3 text-sm text-zinc-400">
                  {column.links.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}

            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1">
              <h2 className="text-sm font-semibold text-white">Comece</h2>
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                Teste uma nota com cálculo, conversão ou markdown e veja o
                editor trabalhando junto com o texto.
              </p>
              <Link
                href="/editor"
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                Abrir editor
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-white/10 border-t pt-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Calcify. Editor de notas que calculam.</p>
          <p className="text-zinc-400">Escreva. Calcule. Continue.</p>
        </div>
      </div>
    </footer>
  );
}
