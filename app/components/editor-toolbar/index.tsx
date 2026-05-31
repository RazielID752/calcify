"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Eraser,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
  Undo2,
} from "lucide-react";
import Image from "next/image";
import LogoCalcify from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type HeadingLevel, mathOptions } from "../editor-commands";

type EditorToolbarProps = {
  activeState: {
    bold: boolean;
    italic: boolean;
    strike: boolean;
    underline: boolean;
    highlight: boolean;
    subscript: boolean;
    superscript: boolean;
    inlineCode: boolean;
    bulletList: boolean;
    orderedList: boolean;
    blockquote: boolean;
    codeBlock: boolean;
    align: "left" | "center" | "right" | null;
  };
  onUndo: () => void;
  onRedo: () => void;
  onResetFormatting: () => void;
  onHeadingChange: (level: HeadingLevel) => void;
  onBulletList: () => void;
  onOrderedList: () => void;
  onBlockquote: () => void;
  onCodeBlock: () => void;
  onBold: () => void;
  onItalic: () => void;
  onStrike: () => void;
  onInlineCode: () => void;
  onUnderline: () => void;
  onHighlight: () => void;
  onLink: () => void;
  onSubscript: () => void;
  onSuperscript: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onImage: () => void;
  onMathChange: (value: string) => void;
  onInsertEquals: () => void;
  onInsertSqrt: () => void;
  onInsertPow: () => void;
  onInsertPi: () => void;
  onRenderMarkdown: () => void;
  onCopyMarkdown: () => void;
  onHelp: () => void;
};

const stopFocusLoss = (event: React.MouseEvent<HTMLElement>) => {
  event.preventDefault();
};

type ToolbarActionButtonProps = React.ComponentProps<typeof Button> & {
  tooltip: string;
};

const ToolbarActionButton = ({
  tooltip,
  ...props
}: ToolbarActionButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button aria-label={tooltip} {...props} />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

export default function EditorToolbar({
  activeState,
  onUndo,
  onRedo,
  onResetFormatting,
  onHeadingChange,
  onBulletList,
  onOrderedList,
  onBlockquote,
  onCodeBlock,
  onBold,
  onItalic,
  onStrike,
  onInlineCode,
  onUnderline,
  onHighlight,
  onLink,
  onSubscript,
  onSuperscript,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onImage,
  onMathChange,
}: EditorToolbarProps) {
  const activeButtonClass =
    "border-zinc-900/10 bg-zinc-900/5 text-emerald-600 hover:bg-zinc-900/10 hover:text-emerald-700";
  const groupClassName =
    "flex shrink-0 snap-start items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-1 py-1 [&_button[data-size='icon-sm']]:size-9 sm:[&_button[data-size='icon-sm']]:size-8";

  return (
    <TooltipProvider>
      <div className="sticky top-15 z-20 rounded-2xl border border-zinc-200 bg-white/95 p-2 shadow-sm backdrop-blur sm:top-[4.25rem]">
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max snap-x snap-mandatory items-center justify-start gap-2 md:justify-between sm:gap-3">
            <div className="shrink-0">
              <Image
                src={LogoCalcify}
                alt="Calcify"
                width={80}
                height={80}
                className="ml-2"
              />
            </div>

            <div className={groupClassName}>
              <ToolbarActionButton
                tooltip="Desfazer"
                type="button"
                variant="outline"
                size="icon-sm"
                onMouseDown={stopFocusLoss}
                onClick={onUndo}
              >
                <Undo2 />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Refazer"
                type="button"
                variant="outline"
                size="icon-sm"
                onMouseDown={stopFocusLoss}
                onClick={onRedo}
              >
                <Redo2 />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Redefinir formato"
                type="button"
                variant="outline"
                size="icon-sm"
                onMouseDown={stopFocusLoss}
                onClick={onResetFormatting}
              >
                <Eraser />
              </ToolbarActionButton>

              <Select
                onValueChange={(value) =>
                  onHeadingChange(value as HeadingLevel)
                }
              >
                <SelectTrigger className="h-9 w-24 sm:h-8 sm:w-28">
                  <SelectValue placeholder="Título" />
                </SelectTrigger>
                <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                  <SelectItem value="h1">H1</SelectItem>
                  <SelectItem value="h2">H2</SelectItem>
                  <SelectItem value="h3">H3</SelectItem>
                  <SelectItem value="h4">H4</SelectItem>
                </SelectContent>
              </Select>

              <ToolbarActionButton
                tooltip="Lista com marcadores"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(activeState.bulletList && activeButtonClass)}
                onMouseDown={stopFocusLoss}
                onClick={onBulletList}
              >
                <List />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Lista numerada"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(activeState.orderedList && activeButtonClass)}
                onMouseDown={stopFocusLoss}
                onClick={onOrderedList}
              >
                <ListOrdered />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Citacao"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(activeState.blockquote && activeButtonClass)}
                onMouseDown={stopFocusLoss}
                onClick={onBlockquote}
              >
                <Quote />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Bloco de codigo"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(activeState.codeBlock && activeButtonClass)}
                onMouseDown={stopFocusLoss}
                onClick={onCodeBlock}
              >
                <SquareCode />
              </ToolbarActionButton>
            </div>

            <div className="hidden h-7 w-px bg-zinc-200 sm:block" />

            <div className={groupClassName}>
              <ToolbarActionButton
                tooltip="Negrito"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(activeState.bold && activeButtonClass)}
                onMouseDown={stopFocusLoss}
                onClick={onBold}
              >
                <Bold />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Italico"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(activeState.italic && activeButtonClass)}
                onMouseDown={stopFocusLoss}
                onClick={onItalic}
              >
                <Italic />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Tachado"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(activeState.strike && activeButtonClass)}
                onMouseDown={stopFocusLoss}
                onClick={onStrike}
              >
                <Strikethrough />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Codigo inline"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(activeState.inlineCode && activeButtonClass)}
                onMouseDown={stopFocusLoss}
                onClick={onInlineCode}
              >
                <Code />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Sublinhado"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(activeState.underline && activeButtonClass)}
                onMouseDown={stopFocusLoss}
                onClick={onUnderline}
              >
                <Underline />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Realce"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(activeState.highlight && activeButtonClass)}
                onMouseDown={stopFocusLoss}
                onClick={onHighlight}
              >
                <Highlighter />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Inserir link"
                type="button"
                variant="outline"
                size="icon-sm"
                onMouseDown={stopFocusLoss}
                onClick={onLink}
              >
                <Link2 />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Subscrito"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(activeState.subscript && activeButtonClass)}
                onMouseDown={stopFocusLoss}
                onClick={onSubscript}
              >
                <Subscript />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Sobrescrito"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(activeState.superscript && activeButtonClass)}
                onMouseDown={stopFocusLoss}
                onClick={onSuperscript}
              >
                <Superscript />
              </ToolbarActionButton>
            </div>

            <div className="hidden h-7 w-px bg-zinc-200 sm:block" />

            <div className={groupClassName}>
              <ToolbarActionButton
                tooltip="Alinhar a esquerda"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(
                  activeState.align === "left" && activeButtonClass,
                )}
                onMouseDown={stopFocusLoss}
                onClick={onAlignLeft}
              >
                <AlignLeft />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Centralizar"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(
                  activeState.align === "center" && activeButtonClass,
                )}
                onMouseDown={stopFocusLoss}
                onClick={onAlignCenter}
              >
                <AlignCenter />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Alinhar a direita"
                type="button"
                variant="outline"
                size="icon-sm"
                className={cn(
                  activeState.align === "right" && activeButtonClass,
                )}
                onMouseDown={stopFocusLoss}
                onClick={onAlignRight}
              >
                <AlignRight />
              </ToolbarActionButton>
              <ToolbarActionButton
                tooltip="Inserir imagem"
                type="button"
                variant="outline"
                size="icon-sm"
                onMouseDown={stopFocusLoss}
                onClick={onImage}
              >
                <ImagePlus />
              </ToolbarActionButton>
              {/* <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onMouseDown={stopFocusLoss}
                onClick={onHelp}
              >
                <CircleHelp className="size-4" />
                Ajuda
              </Button> */}
            </div>

            <div className="hidden h-7 w-px bg-zinc-200 sm:block" />

            <div className="flex shrink-0 snap-start items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-1 py-1 [&_button[data-size='icon-sm']]:size-9 sm:[&_button[data-size='icon-sm']]:size-8">
              <Select onValueChange={onMathChange}>
                <SelectTrigger className="h-9 w-32 sm:h-8 sm:w-44">
                  <SelectValue placeholder="Math" />
                </SelectTrigger>
                <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                  {mathOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
