import type { ComponentProps } from "react";
import {
  type AlignType,
  editorCommands,
  type HeadingLevel,
  type ListType,
} from "../editor-commands";
import EditorToolbar from "../editor-toolbar";

type EditorToolbarState = ComponentProps<typeof EditorToolbar>["activeState"];

type RunEditorCommand = (
  action: (context: {
    editor: HTMLDivElement;
    savedRange: Range | null;
  }) => void,
) => void;

type EditorFormattingToolbarProps = {
  activeState: EditorToolbarState;
  onAlign: (align: AlignType) => void;
  onCopyMarkdown: () => void;
  onHeadingChange: (level: HeadingLevel) => void;
  onHelp: () => void;
  onImage: () => void;
  onInsertMathShortcut: (value: string) => void;
  onLink: () => void;
  onList: (type: ListType) => void;
  onMathChange: (value: string) => void;
  onRenderMarkdown: () => void;
  run: RunEditorCommand;
};

export default function EditorFormattingToolbar({
  activeState,
  onAlign,
  onCopyMarkdown,
  onHeadingChange,
  onHelp,
  onImage,
  onInsertMathShortcut,
  onLink,
  onList,
  onMathChange,
  onRenderMarkdown,
  run,
}: EditorFormattingToolbarProps) {
  return (
    <EditorToolbar
      activeState={activeState}
      onUndo={() => run((context) => editorCommands.undo(context))}
      onRedo={() => run((context) => editorCommands.redo(context))}
      onResetFormatting={() =>
        run((context) => editorCommands.resetFormatting(context))
      }
      onHeadingChange={onHeadingChange}
      onBulletList={() => onList("bullet")}
      onOrderedList={() => onList("ordered")}
      onBlockquote={() => run((context) => editorCommands.blockquote(context))}
      onCodeBlock={() => run((context) => editorCommands.codeBlock(context))}
      onBold={() => run((context) => editorCommands.bold(context))}
      onItalic={() => run((context) => editorCommands.italic(context))}
      onStrike={() => run((context) => editorCommands.strike(context))}
      onInlineCode={() => run((context) => editorCommands.inlineCode(context))}
      onUnderline={() => run((context) => editorCommands.underline(context))}
      onHighlight={() => run((context) => editorCommands.highlight(context))}
      onLink={onLink}
      onSubscript={() => run((context) => editorCommands.subscript(context))}
      onSuperscript={() =>
        run((context) => editorCommands.superscript(context))
      }
      onAlignLeft={() => onAlign("left")}
      onAlignCenter={() => onAlign("center")}
      onAlignRight={() => onAlign("right")}
      onImage={onImage}
      onMathChange={onMathChange}
      onInsertEquals={() => onInsertMathShortcut(" = ")}
      onInsertSqrt={() => onInsertMathShortcut("sqrt()")}
      onInsertPow={() => onInsertMathShortcut("pow(,)")}
      onInsertPi={() => onInsertMathShortcut("pi")}
      onRenderMarkdown={onRenderMarkdown}
      onCopyMarkdown={onCopyMarkdown}
      onHelp={onHelp}
    />
  );
}
