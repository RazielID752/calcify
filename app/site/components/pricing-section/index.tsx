import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pricingPlan, pricingFeatures, whatsappContactUrl } from "../site-data";

export default function PricingSection() {
  return (
    <section id="plano" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-emerald-700 uppercase">
              Plano unico
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-6xl">
              Um plano claro para escrever, calcular e publicar com leveza.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              Calcify entrega as funcoes essenciais do dia a dia sem virar uma
              colcha de retalhos. Um unico plano mensal, simples de entender e
              pronto para concorrer com qualquer editor moderno.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {pricingFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-sm text-zinc-700"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[32px] bg-[radial-gradient(circle_at_top,#d1fae5_0%,rgba(255,255,255,0)_65%)]" />
            <div className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-white/80 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Sparkles className="size-3" />
                  Plano completo
                </div>
                <span className="text-xs font-medium text-zinc-400">
                  {pricingPlan.cadence}
                </span>
              </div>

              <div className="mt-6">
                <div className="text-4xl font-semibold text-zinc-950 sm:text-5xl">
                  R$ {pricingPlan.price}
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  {pricingPlan.tagline}
                </p>
              </div>

              <div className="mt-6 space-y-3 text-sm text-zinc-600">
                {pricingPlan.bullets.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <div className="mt-1 size-1.5 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full gap-2 rounded-md bg-zinc-950 px-5 text-white"
                >
                  <a href={whatsappContactUrl} target="_blank" rel="noreferrer">
                    {pricingPlan.ctaLabel}
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
                <p className="mt-3 text-xs text-zinc-500">
                  Resposta direta no WhatsApp para ativar o plano.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
