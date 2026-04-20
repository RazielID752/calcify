"use client";

import { PencilLine, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type DocumentTabItem = {
  id: string;
  title: string;
};

type DocumentTabsStripProps = {
  documents: DocumentTabItem[];
  activeDocumentId: string;
  onActiveDocumentChange: (id: string) => void;
  onOpenCreateDialog: () => void;
  onRequestRenameDocument: (documentItem: DocumentTabItem) => void;
  onRequestCloseDocument: (documentItem: DocumentTabItem) => void;
};

export default function DocumentTabsStrip({
  documents,
  activeDocumentId,
  onActiveDocumentChange,
  onOpenCreateDialog,
  onRequestRenameDocument,
  onRequestCloseDocument,
}: DocumentTabsStripProps) {
  return (
    <div className="sticky top-0 z-30 -mx-3 mb-3 border-b border-zinc-200/80 bg-white/90 px-3 py-2 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2">
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Tabs
            value={activeDocumentId}
            onValueChange={onActiveDocumentChange}
            className="w-max min-w-full"
          >
            <TabsList className="h-auto min-w-max justify-start gap-1 rounded-none border-0 bg-transparent p-0 text-zinc-500">
              {documents.map((documentItem) => (
                <TabsTrigger
                  asChild
                  key={documentItem.id}
                  value={documentItem.id}
                  className="max-w-[150px] shrink-0 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-zinc-600 shadow-none data-[state=active]:border-zinc-200 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm sm:max-w-[190px]"
                >
                  <div className="inline-flex min-w-0 items-center gap-1">
                    <span className="truncate">{documentItem.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      title="Renomear documento"
                      className="ml-0.5 size-4.5 shrink-0 text-zinc-400 hover:text-zinc-700 sm:size-5"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onRequestRenameDocument(documentItem);
                      }}
                    >
                      <PencilLine className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      title="Fechar documento"
                      className="size-4.5 shrink-0 text-zinc-400 hover:text-red-600 sm:size-5"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onRequestCloseDocument(documentItem);
                      }}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={onOpenCreateDialog}
          title="Criar novo documento"
          className="shrink-0 bg-emerald-200/50 text-emerald-700 hover:bg-emerald-200"
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
