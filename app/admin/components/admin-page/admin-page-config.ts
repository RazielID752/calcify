import type { GroupForm, UserForm } from "@/app/admin/types/types";
import type {
  AdminAccessGroup,
  AdminAccessUser,
} from "@/app/interfaces/admin-access";
import { Perfis } from "@/enum/perfis.enum";

export const ungroupedValue = "none";
export const creatableAdminAccessProfiles = [
  Perfis.USER,
  Perfis.ADMIN,
] as const;
export const adminAccessProfileLabels: Record<Perfis, string> = {
  [Perfis.USER]: "Usuário",
  [Perfis.ADMIN]: "Administrador",
};

export const emptyGroupForm: GroupForm = {
  name: "",
  isActive: true,
};

export const emptyUserForm: UserForm = {
  name: "",
  email: "",
  profile: Perfis.USER,
  isActive: true,
  accessGroupId: null,
};

export const getUserForm = (user: AdminAccessUser): UserForm => ({
  name: user.name,
  email: user.email,
  profile: user.profile,
  isActive: user.isActive,
  accessGroupId: user.accessGroupId,
});

export const getGroupForm = (group: AdminAccessGroup): GroupForm => ({
  name: group.name,
  isActive: group.isActive,
});

export const canCreateAdminAccessProfile = (
  profile: Perfis | null | undefined,
) => {
  if (!profile) {
    return false;
  }

  return creatableAdminAccessProfiles.some(
    (creatableProfile) => creatableProfile === profile,
  );
};
