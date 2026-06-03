import type { FormStateSetter, UserForm } from "@/app/admin/types/types";
import type { AdminAccessGroup } from "@/app/interfaces/admin-access";
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
import type { Perfis } from "@/enum/perfis.enum";
import {
  adminAccessProfileLabels,
  creatableAdminAccessProfiles,
  ungroupedValue,
} from "./admin-page-config";

type UserDialogProps = {
  groups: AdminAccessGroup[];
  isOpen: boolean;
  isSaving: boolean;
  editingUserId: string | null;
  userForm: UserForm;
  onOpenChange: (open: boolean) => void;
  onSaveUser: () => void;
  setUserForm: FormStateSetter<UserForm>;
};

export function UserDialog({
  groups,
  isOpen,
  isSaving,
  editingUserId,
  userForm,
  onOpenChange,
  onSaveUser,
  setUserForm,
}: UserDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingUserId ? "Editar conta" : "Criar conta"}
          </DialogTitle>
          <DialogDescription>
            Configure o acesso individual ou vincule a conta a um grupo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <Input
            value={userForm.name}
            placeholder="Nome"
            onChange={(event) =>
              setUserForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
          <Input
            type="email"
            value={userForm.email}
            placeholder="E-mail"
            onChange={(event) =>
              setUserForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              value={userForm.profile}
              onValueChange={(value) =>
                setUserForm((current) => ({
                  ...current,
                  profile: value as Perfis,
                }))
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {creatableAdminAccessProfiles.map((profile) => (
                  <SelectItem key={profile} value={profile}>
                    {adminAccessProfileLabels[profile]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={userForm.isActive ? "active" : "inactive"}
              onValueChange={(value) =>
                setUserForm((current) => ({
                  ...current,
                  isActive: value === "active",
                }))
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Conta ativa</SelectItem>
                <SelectItem value="inactive">Conta desativada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select
            value={userForm.accessGroupId ?? ungroupedValue}
            onValueChange={(value) =>
              setUserForm((current) => ({
                ...current,
                accessGroupId: value === ungroupedValue ? null : value,
              }))
            }
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ungroupedValue}>Conta individual</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
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
          <Button type="button" disabled={isSaving} onClick={onSaveUser}>
            {editingUserId ? "Salvar conta" : "Criar conta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
