import { CheckCircle2 } from "lucide-react";
import { productGridItems } from "./site-data";

const useCases = [
  "orçamentos",
  "planejamento",
  "reuniões",
  "estudos",
  "documentação",
];

export default function ProductGridSection() {
  return (
    <section id="produto" className="bg-[#f5f5f7] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold tracking-[0.18em] text-emerald-700 uppercase">
            Produto
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-6xl">
            A calma de uma nota. A precisão de uma ferramenta.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
            Calcify é para quando seu texto tem números, decisões e próximos
            passos. Você escreve o raciocínio, faz a conta no mesmo lugar e
            transforma a nota em um documento que pode continuar em outras
            ferramentas.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {useCases.map((item) => (
            <span
              key={item}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {productGridItems.map((item, index) => (
            <article
              key={item.title}
              className={`rounded-lg border border-zinc-200 bg-white p-6 shadow-sm ${item.className ?? ""}`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                  {item.eyebrow}
                </span>
                <item.icon className="size-5 shrink-0 text-emerald-700" />
              </div>

              <div className="mt-8 space-y-2 border-zinc-200 border-l pl-4 font-mono text-sm leading-6 text-zinc-700">
                {item.preview.split("\n").map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>

              <h3
                className={`mt-8 font-semibold tracking-normal text-zinc-950 ${
                  index === 0 ? "text-3xl sm:text-4xl" : "text-2xl"
                }`}
              >
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-zinc-600 md:max-w-3xl">
                {item.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              "Sem trocar para calculadora.",
              "Sem transformar nota em planilha.",
              "Sem prender seu texto em um formato fechado.",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-700" />
                <span className="text-sm font-medium text-zinc-700">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
