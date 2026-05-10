import { ArrowRight, PlayCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProductScene from "./product-scene";
import { heroStats } from "./site-data";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#fbfbf8]">
      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 text-sm font-semibold tracking-[0.18em] text-emerald-700 uppercase">
            Calcify
          </p>
          <h1 className="text-balance text-5xl font-semibold tracking-normal text-zinc-950 sm:text-7xl lg:text-8xl">
            O editor que calcula enquanto você pensa.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-pretty text-lg leading-8 text-zinc-600 sm:text-xl">
            Um espaço limpo para escrever, calcular, converter moedas, organizar
            documentos e manter tudo sincronizado sem transformar sua nota em
            uma planilha.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 gap-2 rounded-md bg-zinc-950 px-5 text-white"
            >
              <Link href="/">
                Abrir editor
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 gap-2 rounded-md bg-white px-5"
            >
              <a href="#recursos">
                <PlayCircle className="size-4" />
                Ver recursos
              </a>
            </Button>
          </div>
        </div>

        <ProductScene />

        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <div key={stat.label} className="bg-white px-5 py-4 text-center">
              <div className="text-2xl font-semibold text-zinc-950">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
