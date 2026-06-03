"use client";

import { AccountsTable } from "@/app/admin/components/accounts-table";
import { AdminPageHeader } from "@/app/admin/components/admin-page/admin-page-header";
import { AdminSummaryCards } from "@/app/admin/components/admin-page/admin-summary-cards";
import { GroupDialog } from "@/app/admin/components/admin-page/group-dialog";
import { TemporaryPasswordBanner } from "@/app/admin/components/admin-page/temporary-password-banner";
import { UserDialog } from "@/app/admin/components/admin-page/user-dialog";
import { GroupsTable } from "@/app/admin/components/groups-table";
import { useAdminPage } from "@/app/admin/hooks/use-admin-page";

export default function AdminPageClient() {
  const adminPage = useAdminPage();

  if (!adminPage.isAllowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-4 text-sm text-zinc-500">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <AdminPageHeader
          onBackToEditor={() => adminPage.router.push("/editor")}
          onCreateGroup={adminPage.openCreateGroupDialog}
          onCreateUser={adminPage.openCreateUserDialog}
        />

        <AdminSummaryCards
          usersCount={adminPage.overview.users.length}
          activeUsersCount={adminPage.activeUsersCount}
          groupsCount={adminPage.overview.groups.length}
        />

        <TemporaryPasswordBanner
          temporaryPassword={adminPage.temporaryPassword}
          temporaryPasswordOwner={adminPage.temporaryPasswordOwner}
          onCopyTemporaryPassword={() =>
            void adminPage.handleCopyTemporaryPassword()
          }
        />

        <AccountsTable
          users={adminPage.overview.users}
          isLoading={adminPage.isLoading}
          openActionsId={adminPage.openActionsId}
          generatingPasswordUserId={adminPage.generatingPasswordUserId}
          onRefresh={() => void adminPage.loadOverview()}
          onToggleActions={adminPage.toggleActions}
          onEditUser={adminPage.openEditUserDialog}
          onGenerateTemporaryPassword={(user) =>
            void adminPage.handleGenerateTemporaryPassword(user)
          }
          onDetachUserFromGroup={(user) =>
            void adminPage.handleDetachUserFromGroup(user)
          }
        />

        <GroupsTable
          groups={adminPage.overview.groups}
          openActionsId={adminPage.openActionsId}
          onCreateGroup={adminPage.openCreateGroupDialog}
          onToggleActions={adminPage.toggleActions}
          onEditGroup={adminPage.openEditGroupDialog}
          onDeleteGroup={(group) => void adminPage.handleDeleteGroup(group)}
        />
      </div>

      <UserDialog
        groups={adminPage.overview.groups}
        isOpen={adminPage.userDialogOpen}
        isSaving={adminPage.isSaving}
        editingUserId={adminPage.editingUserId}
        userForm={adminPage.userForm}
        onOpenChange={adminPage.closeUserDialog}
        onSaveUser={() => void adminPage.handleSaveUser()}
        setUserForm={adminPage.setUserForm}
      />

      <GroupDialog
        isOpen={adminPage.groupDialogOpen}
        isSaving={adminPage.isSaving}
        editingGroupId={adminPage.editingGroupId}
        groupForm={adminPage.groupForm}
        onOpenChange={adminPage.closeGroupDialog}
        onSaveGroup={() => void adminPage.handleSaveGroup()}
        setGroupForm={adminPage.setGroupForm}
      />
    </main>
  );
}
