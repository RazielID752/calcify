import { GripVertical } from "lucide-react";
import type {
  ClipboardEventHandler,
  FocusEventHandler,
  FormEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactNode,
  RefObject,
} from "react";
import { EDITOR_CONTENT_CLASSNAME } from "../editor-content-classname";
import { BODY_PLACEHOLDER, TITLE_PLACEHOLDER } from "../editor-document";

type EditorWritingSurfaceProps = {
  editorRef: RefObject<HTMLDivElement | null>;
  dragHandleTop: number | null;
  dragIndicatorTop: number | null;
  isBodyEmpty: boolean;
  isDraggingBlock: boolean;
  isTitleEmpty: boolean;
  spellcheckPopover: ReactNode;
  onBlur: FocusEventHandler<HTMLDivElement>;
  onBeforeInput: FormEventHandler<HTMLDivElement>;
  onClick: MouseEventHandler<HTMLDivElement>;
  onFocus: FocusEventHandler<HTMLDivElement>;
  onInput: FormEventHandler<HTMLDivElement>;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onKeyUp: KeyboardEventHandler<HTMLDivElement>;
  onMouseUp: MouseEventHandler<HTMLDivElement>;
  onPaste: ClipboardEventHandler<HTMLDivElement>;
  onStartBlockDrag: MouseEventHandler<HTMLButtonElement>;
};

export default function EditorWritingSurface({
  editorRef,
  dragHandleTop,
  dragIndicatorTop,
  isBodyEmpty,
  isDraggingBlock,
  isTitleEmpty,
  spellcheckPopover,
  onBlur,
  onBeforeInput,
  onClick,
  onFocus,
  onInput,
  onKeyDown,
  onKeyUp,
  onMouseUp,
  onPaste,
  onStartBlockDrag,
}: EditorWritingSurfaceProps) {
  return (
    <div className="relative">
      {isTitleEmpty || isBodyEmpty ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 select-none"
        >
          {isTitleEmpty ? (
            <p className="text-4xl font-bold text-zinc-300">
              {TITLE_PLACEHOLDER}
            </p>
          ) : null}
          {isBodyEmpty ? (
            <p
              className={`text-base text-zinc-400 ${isTitleEmpty ? "mt-5" : "mt-15"}`}
            >
              {BODY_PLACEHOLDER}
            </p>
          ) : null}
        </div>
      ) : null}

      {dragHandleTop !== null ? (
        <button
          type="button"
          aria-label="Arrastar bloco"
          title="Arrastar bloco"
          onMouseDown={onStartBlockDrag}
          className={`absolute -left-8 top-0 z-20 hidden size-6 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-emerald-200 hover:text-emerald-800 sm:flex ${isDraggingBlock ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ top: `${dragHandleTop}px` }}
        >
          <GripVertical className="size-4" />
        </button>
      ) : null}

      {isDraggingBlock && dragIndicatorTop !== null ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-20 h-0.5 rounded-full bg-emerald-500/90"
          style={{ top: `${dragIndicatorTop}px` }}
        />
      ) : null}

      {/* biome-ignore lint/a11y/useSemanticElements: um editor rich text precisa de contentEditable para suportar blocos formatados. */}
      <div
        ref={editorRef}
        className={EDITOR_CONTENT_CLASSNAME}
        contentEditable
        tabIndex={0}
        role="textbox"
        aria-multiline="true"
        aria-label="Editor de texto do Calcify"
        spellCheck
        lang="pt-BR"
        suppressContentEditableWarning
        onClick={onClick}
        onInput={onInput}
        onBeforeInput={onBeforeInput}
        onPaste={onPaste}
        onKeyDown={onKeyDown}
        onMouseUp={onMouseUp}
        onKeyUp={onKeyUp}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {spellcheckPopover}
    </div>
  );
}
