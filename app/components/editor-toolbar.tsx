"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type HeadingLevel, mathOptions } from "./editor-commands";

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
};

const stopFocusLoss = (event: React.MouseEvent<HTMLElement>) => {
  event.preventDefault();
};

export default function EditorToolbar({
  activeState,
  onUndo,
  onRedo,
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
    "border-zinc-900/15 bg-zinc-900/10 text-zinc-900 hover:bg-zinc-900/15";

  return (
    <div className="sticky top-3 z-20 overflow-x-auto rounded-2xl border border-zinc-200 bg-white/95 p-2 shadow-sm backdrop-blur">
      <div className="flex min-w-max items-center gap-3 justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-1 py-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onMouseDown={stopFocusLoss}
            onClick={onUndo}
            title="Undo"
          >
            <Undo2 />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onMouseDown={stopFocusLoss}
            onClick={onRedo}
            title="Redo"
          >
            <Redo2 />
          </Button>

          <Select
            onValueChange={(value) => onHeadingChange(value as HeadingLevel)}
          >
            <SelectTrigger className="h-8 w-28">
              <SelectValue placeholder="Heading" />
            </SelectTrigger>
            <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
              <SelectItem value="h1">H1</SelectItem>
              <SelectItem value="h2">H2</SelectItem>
              <SelectItem value="h3">H3</SelectItem>
              <SelectItem value="h4">H4</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.bulletList && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onBulletList}
            title="Bullet list"
          >
            <List />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.orderedList && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onOrderedList}
            title="Ordered list"
          >
            <ListOrdered />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.blockquote && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onBlockquote}
            title="Blockquote"
          >
            <Quote />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.codeBlock && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onCodeBlock}
            title="Code block"
          >
            <SquareCode />
          </Button>
        </div>

        <div className="h-7 w-px bg-zinc-200" />

        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-1 py-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.bold && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onBold}
            title="Bold"
          >
            <Bold />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.italic && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onItalic}
            title="Italic"
          >
            <Italic />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.strike && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onStrike}
            title="Strike"
          >
            <Strikethrough />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.inlineCode && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onInlineCode}
            title="Inline code"
          >
            <Code />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.underline && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onUnderline}
            title="Underline"
          >
            <Underline />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.highlight && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onHighlight}
            title="Highlight"
          >
            <Highlighter />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onMouseDown={stopFocusLoss}
            onClick={onLink}
            title="Link"
          >
            <Link2 />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.subscript && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onSubscript}
            title="Subscript"
          >
            <Subscript />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.superscript && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onSuperscript}
            title="Superscript"
          >
            <Superscript />
          </Button>
        </div>

        <div className="h-7 w-px bg-zinc-200" />

        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-1 py-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.align === "left" && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onAlignLeft}
            title="Align left"
          >
            <AlignLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.align === "center" && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onAlignCenter}
            title="Align center"
          >
            <AlignCenter />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn(activeState.align === "right" && activeButtonClass)}
            onMouseDown={stopFocusLoss}
            onClick={onAlignRight}
            title="Align right"
          >
            <AlignRight />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onMouseDown={stopFocusLoss}
            onClick={onImage}
            title="Add image"
          >
            <ImagePlus />
          </Button>
        </div>

        <div className="h-7 w-px bg-zinc-200" />

        <div className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-1 py-1">
          <Select onValueChange={onMathChange}>
            <SelectTrigger className="h-8 w-44">
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
  );
}
