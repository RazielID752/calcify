"use client";

import {
  Calendar,
  FileText,
  Folder,
  Lock,
  type LucideIcon,
  Plus,
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  type DocumentTitleFormValues,
  documentTitleDefaultValues,
  documentTitleFormSchema,
} from "@/app/forms/document";

type Template = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: LucideIcon;
};

type CreateDocumentDialogProps = {
  open: boolean;
  defaultDocumentTitle: string;
  onOpenChange: (open: boolean) => void;
  onCreateDocument: (title: string) => void;
};

const templates: Template[] = [
  {
    id: "template-meeting",
    name: "Template Reunião",
    description: "Ata, participantes e próximos passos.",
    enabled: false,
    icon: Calendar,
  },
  {
    id: "template-list",
    name: "Template Lista",
    description: "Checklist com prioridades e status.",
    enabled: false,
    icon: FileText,
  },
  {
    id: "template-project",
    name: "Template Projeto",
    description: "Objetivos, entregas e cronograma.",
    enabled: false,
    icon: Folder,
  },
];

export default function CreateDocumentDialog({
  open,
  defaultDocumentTitle,
  onOpenChange,
  onCreateDocument,
}: CreateDocumentDialogProps) {
  const {
	register,
	handleSubmit,
	reset,
	formState: { errors },
  } = useForm<DocumentTitleFormValues>({
	defaultValues: documentTitleDefaultValues,
  });

  useEffect(() => {
    if (!open) {
		reset(documentTitleDefaultValues);
    }
  }, [open, reset]);

  const handleCreateBlankDocument = handleSubmit((values) => {
	onCreateDocument(values.title);
	reset(documentTitleDefaultValues);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100svh-1rem)] w-[calc(100%-1rem)] flex-col overflow-hidden p-0 sm:max-h-[calc(100svh-2rem)] sm:w-[calc(100%-2rem)] sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-zinc-200/80 bg-zinc-50/70 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <FileText className="size-4.5" />
            </div>

            <div className="space-y-1">
              <DialogTitle>Criar novo documento</DialogTitle>
              <DialogDescription>
                Escolha como deseja iniciar a nova aba.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="space-y-4 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                <FileText className="size-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-900">
                  Criar documento em branco
                </p>
                <p className="text-xs text-zinc-600">
                  Cria uma nova aba ativa com editor vazio.
                </p>
              </div>
            </div>

            <form
              id="create-document-form"
              className="space-y-2"
              onSubmit={handleCreateBlankDocument}
            >
              <label
                htmlFor="create-document-name"
                className="mb-3 text-xs font-medium text-zinc-600"
              >
                Nome do documento (opcional)
              </label>

              <div className="relative pt-2">
                <FileText className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="create-document-name"
                  placeholder={defaultDocumentTitle}
                  aria-label="Nome do novo documento"
                  className="h-9 bg-white pl-9"
                  aria-invalid={errors.title ? "true" : "false"}
                  {...register("title", documentTitleFormSchema.title)}
                />
              </div>

              {errors.title ? (
                <p className="text-xs text-red-600">{errors.title.message}</p>
              ) : null}

              <p className="text-xs text-zinc-500">
                Se não preencher, usamos "{defaultDocumentTitle}".
              </p>
            </form>

            <Button
              type="submit"
              form="create-document-form"
              variant="outline"
              className="h-9 w-full justify-center border-emerald-300 bg-emerald-100/70 text-emerald-900 hover:bg-emerald-100"
            >
              <Plus className="size-4" />
              Criar documento em branco
            </Button>
          </div>

          <div className="space-y-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-4">
            <p className="text-sm font-semibold text-zinc-600">
              Templates (em breve)
            </p>

            <div className="grid gap-2 sm:grid-cols-3">
              {templates.map((template) => {
                const TemplateIcon = template.icon;

                return (
                  <Button
                    key={template.id}
                    type="button"
                    variant="outline"
                    disabled={!template.enabled}
                    className="h-auto w-full cursor-not-allowed items-start justify-start whitespace-normal border-zinc-200 bg-white px-3 py-3 text-left opacity-55"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                      <div className="mt-0.5 text-zinc-400">
                        <TemplateIcon className="size-4" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium text-zinc-700">
                          {template.name}
                        </p>
                        <p className="wrap-break-word text-xs leading-4 text-zinc-500">
                          {template.description}
                        </p>
                      </div>
                    </div>
                    <Lock className="ml-auto size-3.5 shrink-0 text-zinc-400" />
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
