import { Plus, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminPageHeaderProps = {
  onBackToEditor: () => void;
  onCreateGroup: () => void;
  onCreateUser: () => void;
};

export function AdminPageHeader({
  onBackToEditor,
  onCreateGroup,
  onCreateUser,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
          <ShieldCheck className="size-4" />
          Área administrativa
        </div>
        <h1 className="text-2xl font-semibold text-zinc-950">
          Controle de contas e acessos
        </h1>
      </div>

      <div className="grid gap-2 sm:flex sm:flex-wrap">
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={onCreateUser}
        >
          <UserPlus className="size-4" />
          Criar conta
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onCreateGroup}
        >
          <Plus className="size-4" />
          Criar grupo
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onBackToEditor}
        >
          Voltar ao editor
        </Button>
      </div>
    </header>
  );
}
