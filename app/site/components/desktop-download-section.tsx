import Image from "next/image";
import Link from "next/link";
import appleLogo from "@/assets/Apple-logo.svg";
import windowsLogo from "@/assets/Windows-logo.svg";
import packageJson from "@/package.json";

const macDownloadUrl =
  process.env.NEXT_PUBLIC_CALCIFY_MAC_DOWNLOAD_URL ??
  "/downloads/calcify-macos.dmg";
const windowsDownloadUrl =
  process.env.NEXT_PUBLIC_CALCIFY_WINDOWS_DOWNLOAD_URL ??
  "/downloads/calcify-windows.exe";

export default function DesktopDownloadSection() {
  return (
    <section id="download" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-emerald-700 uppercase">
                Desktop
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal text-zinc-950 sm:text-6xl">
                Baixe o Calcify para macOS ou Windows.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-700">
                Uma janela dedicada para escrever, calcular e continuar seus
                documentos fora do navegador.
              </p>
            </div>

            <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 shadow-sm lg:min-w-44">
              <p className="text-xs font-medium tracking-[0.14em] text-zinc-500 uppercase">
                Versão atual
              </p>
              <p className="mt-1 text-2xl font-semibold text-zinc-950">
                v{packageJson.version}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={macDownloadUrl}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-zinc-950 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <Image src={appleLogo} alt="" className="size-5" aria-hidden />
              Baixar para macOS
            </Link>
            <Link
              href={windowsDownloadUrl}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-100"
            >
              <Image src={windowsLogo} alt="" className="size-5" aria-hidden />
              Baixar para Windows
            </Link>
          </div>

          <div className="mt-8 border-zinc-200 border-t pt-5">
            <p className="max-w-3xl text-sm leading-6 text-zinc-600">
              O app verifica novas versões ao abrir e avisa quando houver uma
              atualização disponível. Você escolhe quando baixar e instalar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
