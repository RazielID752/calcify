import type { FormStateSetter, GroupForm } from "@/app/admin/types/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GroupDialogProps = {
  isOpen: boolean;
  isSaving: boolean;
  editingGroupId: string | null;
  groupForm: GroupForm;
  onOpenChange: (open: boolean) => void;
  onSaveGroup: () => void;
  setGroupForm: FormStateSetter<GroupForm>;
};

export function GroupDialog({
  isOpen,
  isSaving,
  editingGroupId,
  groupForm,
  onOpenChange,
  onSaveGroup,
  setGroupForm,
}: GroupDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingGroupId ? "Editar grupo" : "Criar grupo"}
          </DialogTitle>
          <DialogDescription>
            Contas vinculadas seguem o status definido neste grupo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <Input
            value={groupForm.name}
            placeholder="Nome do grupo"
            onChange={(event) =>
              setGroupForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
          <Select
            value={groupForm.isActive ? "active" : "inactive"}
            onValueChange={(value) =>
              setGroupForm((current) => ({
                ...current,
                isActive: value === "active",
              }))
            }
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Grupo ativo</SelectItem>
              <SelectItem value="inactive">Grupo desativado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" disabled={isSaving} onClick={onSaveGroup}>
            {editingGroupId ? "Salvar grupo" : "Criar grupo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
