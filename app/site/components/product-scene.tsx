import {
  Bold,
  Calculator,
  CircleHelp,
  Code,
  FileText,
  Globe2,
  Heading1,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  Menu,
  MoreHorizontal,
  Plus,
  Quote,
  Save,
  SquareCode,
  X,
} from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import LogoCalcify from "@/assets/logo.svg";

const tabs = ["Custos da semana", "Planejamento", "Ideias do produto"];

const toolbarGroups = [
  {
    id: "text",
    items: [
      { id: "bold", icon: Bold },
      { id: "italic", icon: Italic },
      { id: "highlight", icon: Highlighter },
      { id: "link", icon: Link2 },
    ],
  },
  {
    id: "blocks",
    items: [
      { id: "list", icon: List },
      { id: "quote", icon: Quote },
      { id: "code-block", icon: SquareCode },
      { id: "inline-code", icon: Code },
    ],
  },
  {
    id: "insert",
    items: [
      { id: "calculator", icon: Calculator },
      { id: "image", icon: ImagePlus },
      { id: "help", icon: CircleHelp },
    ],
  },
];

const menuItems = [
  { label: "Ver documentos", icon: FileText },
  { label: "Ir para o site", icon: Globe2 },
  { label: "Salvar", icon: Save },
];

export default function ProductScene() {
  return (
    <div className="calcify-scale-in relative mx-auto mt-10 w-full max-w-6xl overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-950 p-2 shadow-2xl shadow-zinc-950/20 sm:mt-14 sm:p-3">
      <div className="calcify-shine-line absolute inset-x-12 top-0 h-px bg-white/40" />

      <div className="relative min-h-[560px] overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_top,#e7f7ef_0%,#f8fafc_45%,#ffffff_100%)] px-3 pb-6 sm:px-6">
        <div className="flex h-9 items-center gap-2 bg-white">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#ffbd2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>

        <div className="sticky top-0 z-10 -mx-3 border-b border-zinc-200/80 bg-white/90 px-3 py-2 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex min-w-max items-center gap-1">
                {tabs.map((tab, index) => (
                  <div
                    key={tab}
                    className={`calcify-entrance inline-flex max-w-[170px] items-center gap-1 rounded-md border px-2 py-1 text-sm font-medium ${
                      index === 0
                        ? "border-zinc-200 bg-white text-zinc-900 shadow-sm"
                        : "border-transparent bg-transparent text-zinc-600"
                    }`}
                    style={
                      {
                        "--calcify-delay": `${220 + index * 80}ms`,
                      } as CSSProperties
                    }
                  >
                    <span className="truncate">{tab}</span>
                    {index === 0 ? (
                      <X className="size-3.5 shrink-0 text-zinc-400" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              aria-label="Criar documento"
              className="flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-emerald-200/50 text-emerald-700"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 pt-3">
          <div className="rounded-2xl border border-zinc-200 bg-white/95 p-2 shadow-sm backdrop-blur">
            <div className="flex min-w-max items-center justify-start gap-2 sm:gap-3">
              <div className="shrink-0">
                <Image
                  src={LogoCalcify}
                  alt="Calcify"
                  width={80}
                  height={80}
                  className="ml-2"
                />
              </div>

              {toolbarGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1"
                >
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label="Ferramenta do editor"
                      className={`flex size-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-xs ${
                        item.id === "bold"
                          ? "border-zinc-900/10 bg-zinc-900/5 text-emerald-600"
                          : ""
                      }`}
                    >
                      <item.icon className="size-4" />
                    </button>
                  ))}
                </div>
              ))}

              <div className="hidden h-7 w-px bg-zinc-200 md:block" />

              <div className="hidden items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm text-zinc-600 lg:flex">
                <Heading1 className="size-4" />
                Título
              </div>
            </div>
          </div>

          <div className="relative p-3 sm:p-3">
            <button
              type="button"
              aria-label="Arrastar bloco"
              className="absolute top-26 left-0 hidden size-6 items-center justify-center rounded-md text-zinc-400 sm:flex"
            >
              <MoreHorizontal className="size-4" />
            </button>

            <div className="mx-auto min-h-[340px] w-full max-w-7xl rounded-xl bg-white/70 px-3 py-6 outline-none sm:px-8">
              <div className="max-w-3xl">
                <h2 className="text-4xl font-semibold text-zinc-950">
                  Custos da semana
                </h2>
                <p className="mt-5 text-base leading-[1.6] text-zinc-700">
                  Compra de servidor: <strong>120 USD to BRL</strong>
                </p>
                <div className="calcify-result-pulse mt-5 rounded-[6px] border border-zinc-300 bg-zinc-100 px-3 py-2 font-mono text-[0.875em] text-zinc-800">
                  120 USD → BRL 596.40
                </div>
                <p className="mt-5 text-base leading-[1.6] text-zinc-700">
                  Estimativa final: <strong>596.40 + 89.90 + 49.90</strong>
                </p>
                <pre className="mt-6 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-zinc-100">
                  <code>Resultado automático: R$ 736,20</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-5 left-4 sm:left-6">
          <div className="mb-2 w-56 rounded-xl border border-zinc-200 bg-white/95 p-2 shadow-lg backdrop-blur">
            {menuItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-zinc-700"
              >
                <item.icon className="size-4 text-emerald-600" />
                {item.label}
              </div>
            ))}
          </div>
          <div className="flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-emerald-600 shadow-sm backdrop-blur-sm">
            <Menu className="size-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
