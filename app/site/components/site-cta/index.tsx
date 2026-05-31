import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SiteCta() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <FileText className="mx-auto size-9 text-emerald-700" />
        <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-normal text-zinc-950 sm:text-6xl">
          Abra um documento e deixe o trabalho simples ficar simples.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
          Calcify é para escrever com a leveza de um bloco de notas e a precisão
          de uma ferramenta feita para cálculo, conversão e organização.
        </p>
        <div className="mt-8 flex justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 gap-2 rounded-md bg-zinc-950 px-5 text-white"
          >
            <Link href="/editor">
              Começar agora
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}