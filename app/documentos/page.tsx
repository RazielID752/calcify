"use client";
import DOMPurify from "dompurify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type {
  DocumentApiResponse,
  DocumentListApiResponse,
} from "@/app/interfaces/documents";
import { authConfig } from "@/app/services/billing.service";
import { Button } from "@/components/ui/button";
import { apiClient, getApiErrorMessage } from "@/utils/api-client";
import { hasStoredAuthSession } from "@/utils/auth-session";
import { htmlToMarkdown } from "@/utils/markdown-utils";
export default function ReadonlyDocuments() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentApiResponse[]>([]);
  const [selected, setSelected] = useState<DocumentApiResponse | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!hasStoredAuthSession()) {
      router.replace("/login?next=/documentos");
      return;
    }
    let active = true;
    apiClient
      .get<DocumentListApiResponse>(
        `/api/documents?ownedOnly=true&page=${page}&pageSize=20`,
        authConfig(),
      )
      .then(({ data }) => {
        if (active) {
          setDocs(data.items);
          setTotal(data.total);
        }
      })
      .catch((e) => {
        if (active) setError(getApiErrorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [page, router]);
  const exportMarkdown = () => {
    if (!selected) return;
    const blob = new Blob(
      [htmlToMarkdown(DOMPurify.sanitize(selected.content))],
      { type: "text/markdown;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selected.title.replace(/[^\p{L}\p{N}\s_-]/gu, "").slice(0, 100) || "documento"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-semibold">Meus documentos</h1>
          <p className="text-zinc-500">Somente leitura e exportação.</p>
        </div>
        <Link href="/assinatura" className="underline">
          Minha assinatura
        </Link>
      </header>
      {error && <p role="alert">{error}</p>}
      <div className="grid gap-6 md:grid-cols-[260px_1fr] print:block">
        <aside className="space-y-2 print:hidden">
          {docs.map((doc) => (
            <button
              type="button"
              key={doc.id}
              onClick={() => setSelected(doc)}
              className={`block w-full rounded-lg border p-3 text-left ${selected?.id === doc.id ? "bg-emerald-50" : "bg-white"}`}
            >
              {doc.title}
            </button>
          ))}
          {!docs.length && <p>Nenhum documento encontrado.</p>}
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={page * 20 >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </aside>
        <section className="min-w-0 space-y-4">
          {selected ? (
            <>
              <div className="flex gap-3 print:hidden">
                <Button onClick={exportMarkdown}>Exportar Markdown</Button>
                <Button variant="outline" onClick={() => window.print()}>
                  Exportar PDF / imprimir
                </Button>
              </div>
              <h2 className="text-2xl font-semibold">{selected.title}</h2>
              <article
                className="prose max-w-none rounded-xl border p-6 print:border-0"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Document HTML is sanitized with DOMPurify below.
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(selected.content, {
                    FORBID_TAGS: ["form", "input", "button", "iframe"],
                    FORBID_ATTR: ["contenteditable"],
                  }),
                }}
              />
            </>
          ) : (
            <p className="text-zinc-500">Selecione um documento.</p>
          )}
        </section>
      </div>
    </main>
  );
}
