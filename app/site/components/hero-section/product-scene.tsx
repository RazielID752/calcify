import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code,
  Eraser,
  FileText,
  Globe2,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  type LucideIcon,
  Menu,
  MoreHorizontal,
  Plus,
  Quote,
  Redo2,
  Save,
  SquareCode,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import LogoCalcify from "@/assets/logo.svg";

const tabs = ["Custos da semana", "Planejamento", "Ideias do produto"];

type ToolbarPreviewItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

const toolbarButtonGroups: ToolbarPreviewItem[][] = [
  [
    { id: "undo", label: "Desfazer", icon: Undo2 },
    { id: "redo", label: "Refazer", icon: Redo2 },
    { id: "clear-format", label: "Redefinir formato", icon: Eraser },
    { id: "bullet-list", label: "Lista com marcadores", icon: List },
    { id: "ordered-list", label: "Lista numerada", icon: ListOrdered },
    { id: "quote", label: "Citacao", icon: Quote },
    { id: "code-block", label: "Bloco de codigo", icon: SquareCode },
  ],
  [
    { id: "bold", label: "Negrito", icon: Bold, active: true },
    { id: "italic", label: "Italico", icon: Italic },
    { id: "strike", label: "Tachado", icon: Strikethrough },
    { id: "inline-code", label: "Codigo inline", icon: Code },
    { id: "underline", label: "Sublinhado", icon: Underline },
    { id: "highlight", label: "Realce", icon: Highlighter, active: true },
    { id: "link", label: "Inserir link", icon: Link2 },
    { id: "subscript", label: "Subscrito", icon: Subscript },
    { id: "superscript", label: "Sobrescrito", icon: Superscript },
  ],
  [
    { id: "align-left", label: "Alinhar a esquerda", icon: AlignLeft },
    {
      id: "align-center",
      label: "Centralizar",
      icon: AlignCenter,
      active: true,
    },
    { id: "align-right", label: "Alinhar a direita", icon: AlignRight },
    { id: "image", label: "Inserir imagem", icon: ImagePlus },
  ],
];

const toolbarSelects = {
  heading: "Título",
  math: "Math",
};

const toolbarGroupClassName =
  "flex shrink-0 snap-start items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-1 py-1";

const toolbarButtonClassName =
  "flex size-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-xs sm:size-8";

const activeToolbarButtonClassName =
  "border-zinc-900/10 bg-zinc-900/5 text-emerald-600";

function ToolbarPreviewButton({ item }: { item: ToolbarPreviewItem }) {
  return (
    <button
      type="button"
      aria-label={item.label}
      className={`${toolbarButtonClassName} ${
        item.active ? activeToolbarButtonClassName : ""
      }`}
    >
      <item.icon className="size-4" />
    </button>
  );
}

function ToolbarPreviewDivider() {
  return <div className="hidden h-7 w-px shrink-0 bg-zinc-200 sm:block" />;
}

function ToolbarPreviewSelect({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "math";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex h-9 shrink-0 items-center justify-between rounded-md border bg-white px-3 text-sm text-zinc-700 shadow-xs sm:h-8 ${
        variant === "math"
          ? "w-32 border-emerald-200 sm:w-44"
          : "w-24 border-zinc-200 sm:w-28"
      }`}
    >
      <span>{label}</span>
      <ChevronDown className="ml-2 size-3.5 text-zinc-400" />
    </button>
  );
}

const menuItems = [
  { label: "Ver documentos", icon: FileText },
  { label: "Ir para o site", icon: Globe2 },
  { label: "Salvar", icon: Save },
];

export default function ProductScene() {
  return (
    <div className="calcify-scale-in relative mx-auto mt-10 w-full max-w-6xl overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-950 p-2 shadow-2xl shadow-zinc-950/20 sm:mt-14 sm:p-3">
      <div className="calcify-shine-line absolute inset-x-12 top-0 h-px bg-white/40" />

      <div className="relative min-h-140 overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_top,#e7f7ef_0%,#f8fafc_45%,#ffffff_100%)] px-3 pb-6 sm:px-6">
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
                    className={`calcify-entrance inline-flex max-w-42.5 items-center gap-1 rounded-md border px-2 py-1 text-sm font-medium ${
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
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max snap-x snap-mandatory items-center justify-start gap-2 sm:gap-3">
                <div className="shrink-0">
                  <Image
                    src={LogoCalcify}
                    alt="Calcify"
                    width={80}
                    height={80}
                    className="ml-2"
                  />
                </div>

                <div className={toolbarGroupClassName}>
                  {toolbarButtonGroups[0]?.slice(0, 3).map((item) => (
                    <ToolbarPreviewButton key={item.id} item={item} />
                  ))}
                  <ToolbarPreviewSelect label={toolbarSelects.heading} />
                  {toolbarButtonGroups[0]?.slice(3).map((item) => (
                    <ToolbarPreviewButton key={item.id} item={item} />
                  ))}
                </div>

                <ToolbarPreviewDivider />

                <div className={toolbarGroupClassName}>
                  {toolbarButtonGroups[1]?.map((item) => (
                    <ToolbarPreviewButton key={item.id} item={item} />
                  ))}
                </div>

                <ToolbarPreviewDivider />

                <div className={toolbarGroupClassName}>
                  {toolbarButtonGroups[2]?.map((item) => (
                    <ToolbarPreviewButton key={item.id} item={item} />
                  ))}
                </div>

                <ToolbarPreviewDivider />

                <div className="flex shrink-0 snap-start items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-1 py-1">
                  <ToolbarPreviewSelect
                    label={toolbarSelects.math}
                    variant="math"
                  />
                </div>
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

            <div className="mx-auto min-h-85 w-full max-w-7xl rounded-xl bg-white/70 px-3 py-6 outline-none sm:px-8">
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

                <p className="mt-6 text-base leading-[1.7] text-zinc-700">
                  Depois disso, criar a documentação e exportar o resumo em
                  markdown fica simples.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgb(255_255_255/0)_0%,rgb(255_255_255/0.88)_72%,rgb(255_255_255/1)_100%)]" />
      </div>
    </div>
  );
}