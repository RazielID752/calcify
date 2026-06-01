import type { Perfis } from "@/enum/perfis.enum";

export type AdminAccessGroup = {
  id: string;
  name: string;
  isActive: boolean;
  usersCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminAccessUser = {
  id: string;
  name: string;
  email: string;
  profile: Perfis;
  isActive: boolean;
  mustChangePassword: boolean;
  accessGroupId: string | null;
  accessGroupName: string | null;
  accessGroupIsActive: boolean | null;
  effectiveAccess: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export type AdminAccessOverview = {
  groups: AdminAccessGroup[];
  users: AdminAccessUser[];
};

export type AdminAccessGroupPayload = {
  name: string;
  isActive: boolean;
};

export type AdminAccessUserPayload = {
  name: string;
  email: string;
  profile: Perfis;
  isActive: boolean;
  accessGroupId: string | null;
};

export type AdminCreatedUser = AdminAccessUserPayload & {
  id: string;
  mustChangePassword: boolean;
  temporaryPassword: string;
};

export type AdminGeneratedTemporaryPassword = {
  id: string;
  email: string;
  mustChangePassword: boolean;
  temporaryPassword: string;
};
