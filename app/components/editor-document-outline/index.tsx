import { ListTree } from "lucide-react";
import { cn } from "@/lib/utils";

export type EditorOutlineItem = {
  headingIndex: number;
  id: string;
  level: 1 | 2 | 3 | 4;
  title: string;
};

type EditorDocumentOutlineProps = {
  activeItemIndex: number;
  items: EditorOutlineItem[];
  onSelect: (item: EditorOutlineItem) => void;
};

const COMPACT_BAR_LIMIT = 7;
const ACTIVE_BAR_CLASSNAME = "bg-emerald-500/90";
const INACTIVE_BAR_CLASSNAME = "bg-zinc-400/80";
const ACTIVE_ITEM_CLASSNAME = "bg-emerald-50 text-emerald-700";

const getBarWidthClassName = (level: EditorOutlineItem["level"]) => {
  switch (level) {
    case 1:
      return "w-9";
    case 2:
      return "w-7";
    case 3:
      return "w-5";
    case 4:
      return "w-3";
  }
};

const getIndentClassName = (level: EditorOutlineItem["level"]) => {
  switch (level) {
    case 1:
      return "pl-2 font-medium text-zinc-800";
    case 2:
      return "pl-5 text-zinc-700";
    case 3:
      return "pl-8 text-zinc-600";
    case 4:
      return "pl-11 text-zinc-500";
  }
};

const isOutlineItemActive = (itemIndex: number, activeItemIndex: number) =>
  itemIndex === activeItemIndex;

export default function EditorDocumentOutline({
  activeItemIndex,
  items,
  onSelect,
}: EditorDocumentOutlineProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <aside className="group/outline fixed top-1/2 right-5 z-30 hidden -translate-y-1/2 lg:block">
      <div className="relative flex min-h-36 items-center justify-end">
        <div className="flex w-10 flex-col items-end gap-2 transition-opacity duration-150 group-hover/outline:opacity-0 group-focus-within/outline:opacity-0">
          {items.slice(0, COMPACT_BAR_LIMIT).map((item, itemIndex) => (
            <span
              aria-hidden="true"
              className={cn(
                "h-0.5 rounded-full transition-colors duration-200",
                isOutlineItemActive(itemIndex, activeItemIndex)
                  ? ACTIVE_BAR_CLASSNAME
                  : INACTIVE_BAR_CLASSNAME,
                getBarWidthClassName(item.level),
              )}
              key={item.id}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute right-0 w-64 translate-x-2 rounded-xl border border-zinc-200 bg-white/95 p-2 opacity-0 shadow-lg backdrop-blur transition-all duration-200 group-hover/outline:pointer-events-auto group-hover/outline:translate-x-0 group-hover/outline:opacity-100 group-focus-within/outline:pointer-events-auto group-focus-within/outline:translate-x-0 group-focus-within/outline:opacity-100">
          <div className="mb-2 flex items-center gap-2 border-b border-zinc-100 px-2 pb-2 text-xs font-medium text-zinc-500">
            <ListTree className="size-4" />
            Índice
          </div>
          <nav
            aria-label="Índice do documento"
            className="max-h-[62vh] overflow-y-auto pr-1"
          >
            <div className="space-y-1">
              {items.map((item, itemIndex) => (
                <button
                  type="button"
                  className={cn(
                    "block w-full rounded-md py-1.5 pr-2 text-left text-sm leading-snug transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                    getIndentClassName(item.level),
                    isOutlineItemActive(itemIndex, activeItemIndex) &&
                      ACTIVE_ITEM_CLASSNAME,
                  )}
                  key={item.id}
                  onClick={() => onSelect(item)}
                >
                  <span className="line-clamp-2">{item.title}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
}
