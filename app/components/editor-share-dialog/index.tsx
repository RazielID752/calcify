"use client";

import { Copy, Globe2, LockKeyhole, Mail, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DocumentGeneralAccess,
  DocumentShareSettings,
} from "../hooks/use-document-sharing";

type EditorShareDialogProps = {
  documentTitle: string;
  isLoading: boolean;
  open: boolean;
  owner: { name: string; email: string } | null;
  settings: DocumentShareSettings;
  shareLink: string;
  onCopyLink: () => void;
  onInviteEditor: (email: string) => Promise<{ ok: boolean; message: string }>;
  onGeneralAccessChange: (access: DocumentGeneralAccess) => Promise<void>;
  onOpenChange: (open: boolean) => void;
};

const getGeneralAccessLabel = (access: DocumentGeneralAccess) =>
  access === "public"
    ? "Qualquer pessoa com o link pode editar"
    : "Somente pessoas convidadas podem editar";

export default function EditorShareDialog({
  documentTitle,
  isLoading,
  open,
  owner,
  settings,
  shareLink,
  onCopyLink,
  onInviteEditor,
  onGeneralAccessChange,
  onOpenChange,
}: EditorShareDialogProps) {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setErrorMessage("");
      setIsInviting(false);
    }
  }, [open]);

  const handleInvite = async () => {
    setIsInviting(true);
    const result = await onInviteEditor(email);
    setIsInviting(false);

    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }

    setEmail("");
    setErrorMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-4.5 text-emerald-700" />
            Compartilhar documento
          </DialogTitle>
          <DialogDescription className="truncate mb-2">
            {documentTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              placeholder="Digite o e-mail"
              className="h-10 bg-zinc-50 focus-visible:bg-white"
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleInvite();
                }
              }}
            />
            <Button
              type="button"
              className="shrink-0"
              disabled={isInviting}
              onClick={() => void handleInvite()}
            >
              <Mail className="size-4" />
              {isInviting ? "Compartilhando..." : "Compartilhar"}
            </Button>
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <section className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase">
              Pessoas com acesso
            </p>

            {owner ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {owner.name} <span className="text-zinc-500">(Você)</span>
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {owner.email}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-zinc-600">
                  Proprietário
                </span>
              </div>
            ) : null}

            {settings.users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{user.email}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-emerald-700">
                  Editor
                </span>
              </div>
            ))}

            {isLoading ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
                Carregando permissões...
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900">
              {settings.generalAccess === "public" ? (
                <Globe2 className="size-4 text-emerald-700" />
              ) : (
                <LockKeyhole className="size-4 text-zinc-500" />
              )}
              Acesso geral
            </div>

            <Select
              value={settings.generalAccess}
              onValueChange={(value) =>
                void onGeneralAccessChange(value as DocumentGeneralAccess)
              }
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Privado</SelectItem>
                <SelectItem value="public">Público com link</SelectItem>
              </SelectContent>
            </Select>

            <p className="mt-2 text-xs text-zinc-500">
              {getGeneralAccessLabel(settings.generalAccess)}
            </p>
          </section>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="min-w-0 flex-1 truncate rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
            {shareLink}
          </div>
          <Button type="button" variant="outline" onClick={onCopyLink}>
            <Copy className="size-4" />
            Copiar link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
