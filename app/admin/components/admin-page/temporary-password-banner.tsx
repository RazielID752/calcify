import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type TemporaryPasswordBannerProps = {
  temporaryPassword: string;
  temporaryPasswordOwner: string;
  onCopyTemporaryPassword: () => void;
};

export function TemporaryPasswordBanner({
  temporaryPassword,
  temporaryPasswordOwner,
  onCopyTemporaryPassword,
}: TemporaryPasswordBannerProps) {
  if (!temporaryPassword) {
    return null;
  }

  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-emerald-800 uppercase">
            Senha temporária
          </p>
          {temporaryPasswordOwner ? (
            <p className="mt-1 truncate text-sm text-emerald-800">
              {temporaryPasswordOwner}
            </p>
          ) : null}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md bg-white px-3 py-2 text-sm text-emerald-900">
            {temporaryPassword}
          </code>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={onCopyTemporaryPassword}
          >
            <Copy className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
