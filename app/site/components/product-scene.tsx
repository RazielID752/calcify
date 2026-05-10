import {
  Calculator,
  Check,
  Cloud,
  FileText,
  Library,
  MoreHorizontal,
} from "lucide-react";
import { productPills } from "./site-data";

const sideStatusItems = [
  { label: "Salvo na nuvem", icon: Cloud },
  { label: "Aberto em aba", icon: Library },
  { label: "Cálculo resolvido", icon: Calculator },
];

export default function ProductScene() {
  return (
    <div className="relative mx-auto mt-10 w-full max-w-6xl overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-950 p-2 shadow-2xl shadow-zinc-950/20 sm:mt-14 sm:p-3">
      <div className="absolute inset-x-12 top-0 h-px bg-white/40" />
      <div className="grid min-h-[520px] overflow-hidden rounded-[22px] bg-[#f7f7f4] md:grid-cols-[230px_1fr_280px]">
        <aside className="hidden border-zinc-200 border-r bg-[#ededeb] p-4 md:block">
          <div className="mb-6 flex items-center gap-2">
            <span className="size-3 rounded-full bg-red-400" />
            <span className="size-3 rounded-full bg-amber-400" />
            <span className="size-3 rounded-full bg-emerald-400" />
          </div>
          <div className="mb-5 text-xs font-medium text-zinc-500">
            Biblioteca
          </div>
          <div className="space-y-2">
            {["Planejamento", "Custos da semana", "Ideias do produto"].map(
              (item, index) => (
                <div
                  key={item}
                  className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${
                    index === 1
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-600"
                  }`}
                >
                  <FileText className="size-4" />
                  <span className="truncate">{item}</span>
                </div>
              ),
            )}
          </div>

          <div className="mt-8 rounded-lg bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Cloud className="size-4 text-emerald-600" />
              Sync ativo
            </div>
            <p className="text-xs leading-5 text-zinc-500">
              Local e nuvem conversam sem duplicar documentos.
            </p>
          </div>
        </aside>

        <main className="min-w-0 bg-white p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            {productPills.map((pill) => (
              <span
                key={pill.label}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${pill.tone}`}
              >
                {pill.label}
              </span>
            ))}
          </div>

          <div className="max-w-2xl">
            <div className="mb-3 text-sm text-zinc-400">Documento</div>
            <h2 className="text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
              Custos da semana
            </h2>
            <div className="mt-8 space-y-5 text-lg leading-8 text-zinc-700">
              <p>
                Compra de servidor: <strong>120 USD to BRL</strong>
              </p>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950">
                120 USD → BRL 596.40
              </div>
              <p>
                Estimativa final: <strong>596.40 + 89.90 + 49.90</strong>
              </p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
                Resultado automático: R$ 736,20
              </div>
            </div>
          </div>
        </main>

        <aside className="border-zinc-200 border-t bg-zinc-50 p-4 md:border-t-0 md:border-l">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-950">
              Ver documentos
            </span>
            <MoreHorizontal className="size-4 text-zinc-400" />
          </div>
          <div className="space-y-3">
            {sideStatusItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg bg-white p-3 text-sm shadow-sm"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
                  <item.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <Check className="size-4 text-emerald-600" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
