import { workflowItems } from "./site-data";

export default function WorkflowSection() {
  return (
    <section id="fluxo" className="bg-[#f6f0e8] py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-rose-700 uppercase">
            Fluxo
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-6xl">
            Um documento que acompanha a velocidade da ideia.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-700">
            Comece como em um bloco de notas, organize como em um editor moderno
            e resolva contas sem trocar de ferramenta.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {workflowItems.map((item, index) => (
            <article
              key={item.title}
              className="rounded-lg border border-zinc-900/10 bg-white/80 p-6 shadow-sm"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-500">
                  0{index + 1}
                </span>
                <item.icon className="size-5 text-zinc-950" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-950">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
