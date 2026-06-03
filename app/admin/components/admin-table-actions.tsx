import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type AdminTableActionsProps = {
  isOpen: boolean;
  ariaLabel: string;
  menuClassName?: string;
  onToggle: () => void;
  children: ReactNode;
};

export function AdminTableActions({
  isOpen,
  ariaLabel,
  menuClassName = "w-56",
  onToggle,
  children,
}: AdminTableActionsProps) {
  return (
    <div className={`relative flex justify-end ${isOpen ? "z-[100]" : "z-10"}`}>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={ariaLabel}
        onClick={onToggle}
      >
        <MoreHorizontal className="size-4" />
      </Button>

      {isOpen ? (
        <div
          className={`absolute top-10 right-0 z-[110] rounded-lg border border-zinc-200 bg-white p-1 shadow-lg ${menuClassName}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
