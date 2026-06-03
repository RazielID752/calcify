import type { Dispatch, SetStateAction } from "react";
import type {
  AdminAccessGroup,
  AdminAccessUser,
  AdminAccessUserPayload,
} from "@/app/interfaces/admin-access";

export type GroupForm = {
  name: string;
  isActive: boolean;
};

export type UserForm = AdminAccessUserPayload;

export type FormStateSetter<T> = Dispatch<SetStateAction<T>>;

export type AccountsTableProps = {
  users: AdminAccessUser[];
  isLoading: boolean;
  openActionsId: string | null;
  generatingPasswordUserId: string | null;
  onRefresh: () => void;
  onToggleActions: (id: string) => void;
  onEditUser: (user: AdminAccessUser) => void;
  onGenerateTemporaryPassword: (user: AdminAccessUser) => void;
  onDetachUserFromGroup: (user: AdminAccessUser) => void;
};

export type AccountsTableBodyProps = Omit<AccountsTableProps, "onRefresh">;

export type GroupsTableProps = {
  groups: AdminAccessGroup[];
  openActionsId: string | null;
  onCreateGroup: () => void;
  onToggleActions: (id: string) => void;
  onEditGroup: (group: AdminAccessGroup) => void;
  onDeleteGroup: (group: AdminAccessGroup) => void;
};

export type GroupsTableBodyProps = Omit<GroupsTableProps, "onCreateGroup">;
