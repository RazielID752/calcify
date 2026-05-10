import { featureHighlights } from "./site-data";

export default function FeaturesSection() {
  return (
    <section id="recursos" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.18em] text-emerald-700 uppercase">
            Recursos
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-6xl">
            Tudo que parece pequeno, mas quebra o ritmo, fica automático.
          </h2>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 md:grid-cols-2 lg:grid-cols-4">
          {featureHighlights.map((feature) => (
            <article key={feature.title} className="bg-white p-6 sm:p-7">
              <feature.icon className="size-6 text-emerald-700" />
              <h3 className="mt-7 text-xl font-semibold text-zinc-950">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
