import { CheckCircle2 } from "lucide-react";
import { qualityItems, trustItems } from "./site-data";

export default function SyncSection() {
  return (
    <section id="diferencial" className="bg-zinc-950 py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-emerald-300 uppercase">
              Por que Calcify
            </p>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-normal sm:text-6xl">
              Para quando uma nota precisa fazer mais do que guardar texto.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Calcify é fácil de usar, página limpa, pensar rápido, transformar números em respostas
              e terminar com um documento pronto para compartilhar ou exportar.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-6">
            <div className="mb-5 text-sm font-semibold text-zinc-200">
              O que muda na prática
            </div>
            <div className="space-y-3">
              {trustItems.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-md border border-white/10 bg-white/[0.05] p-3 text-sm text-zinc-200"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 md:grid-cols-2">
          {qualityItems.map((item) => (
            <article key={item.title} className="bg-zinc-950 p-6 sm:p-8">
              <item.icon className="size-6 text-amber-300" />
              <h3 className="mt-6 text-2xl font-semibold">{item.title}</h3>
              <p className="mt-3 leading-7 text-zinc-300">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
