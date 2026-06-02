"use client";

import { PencilLine, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <TooltipProvider>
      <div className="sticky top-0 z-30 -mx-3 mb-3 border-b border-zinc-200/80 bg-zinc-50/95 px-3 pt-2 pb-1.5 backdrop-blur sm:-mx-6 sm:bg-white/90 sm:px-6 sm:py-2">
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
                    className="group relative max-w-56 shrink-0 rounded-t-2xl rounded-b-md border border-zinc-200/80 bg-zinc-100/80 px-3 py-2 text-sm font-medium text-zinc-600 shadow-none transition-colors before:absolute before:right-2 before:bottom-0 before:left-2 before:h-0.5 before:rounded-full before:bg-transparent data-[state=active]:border-zinc-200 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm data-[state=active]:before:bg-emerald-500 sm:max-w-47.5 sm:rounded-md sm:border-transparent sm:bg-transparent sm:px-2 sm:py-1 sm:before:hidden"
                    onDoubleClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onRequestRenameDocument(documentItem);
                    }}
                  >
                    <div className="inline-flex min-w-0 items-center gap-2 sm:gap-1.5">
                      <span className="truncate">{documentItem.title}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Renomear documento"
                            className="hidden size-5 shrink-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 sm:inline-flex"
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
                            <PencilLine className="size-4 sm:size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Renomear documento</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Fechar documento"
                            className="size-7 shrink-0 rounded-full text-zinc-500 hover:bg-red-50 hover:text-red-600 sm:size-5"
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
                            <X className="size-4 sm:size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Fechar documento</TooltipContent>
                      </Tooltip>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                onClick={onOpenCreateDialog}
                aria-label="Criar novo documento"
                className="size-10 shrink-0 rounded-full border-zinc-200 bg-white text-emerald-700 shadow-sm hover:bg-emerald-50 sm:size-8 sm:bg-emerald-200/50 sm:hover:bg-emerald-200"
              >
                <Plus />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Criar novo documento</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
