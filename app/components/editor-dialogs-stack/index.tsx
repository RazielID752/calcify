import EditorHelpDialog from "../editor-help-dialog";
import EditorImportDialog from "../editor-import-dialog";
import EditorLogoutDialog from "../editor-logout-dialog";
import EditorShareDialog from "../editor-share-dialog";
import type {
  DocumentGeneralAccess,
  DocumentShareSettings,
} from "../hooks/use-document-sharing";
import ImageDialog from "../image-dialog";
import LinkDialog from "../link-dialog";

type EditorDialogsStackProps = {
  activeDocumentTitle: string;
  imageDialogOpen: boolean;
  importDialogOpen: boolean;
  linkDialogOpen: boolean;
  linkUrl: string;
  logoutDialogOpen: boolean;
  openHelpDialog: boolean;
  openLinkInNewTab: boolean;
  openShareDialog: boolean;
  isLogoutSubmitting: boolean;
  isShareLoading: boolean;
  shareLink: string;
  shareOwner: { name: string; email: string } | null;
  shareSettings: DocumentShareSettings;
  onApplyLink: () => void;
  onConfirmLogout: () => void;
  onCopyShareLink: () => void;
  onGeneralShareAccessChange: (access: DocumentGeneralAccess) => Promise<void>;
  onHelpDialogOpenChange: (open: boolean) => void;
  onImageDialogOpenChange: (open: boolean) => void;
  onImportDialogOpenChange: (open: boolean) => void;
  onImportMarkdown: (markdown: string) => void;
  onInsertImage: (url: string) => void;
  onInviteShareEditor: (
    email: string,
  ) => Promise<{ ok: boolean; message: string }>;
  onLinkDialogOpenChange: (open: boolean) => void;
  onLinkUrlChange: (url: string) => void;
  onLogoutDialogOpenChange: (open: boolean) => void;
  onOpenLinkInNewTabChange: (open: boolean) => void;
  onRemoveImage: () => void;
  onRemoveLink: () => void;
  onShareDialogOpenChange: (open: boolean) => void;
};

export default function EditorDialogsStack({
  activeDocumentTitle,
  imageDialogOpen,
  importDialogOpen,
  linkDialogOpen,
  linkUrl,
  logoutDialogOpen,
  openHelpDialog,
  openLinkInNewTab,
  openShareDialog,
  isLogoutSubmitting,
  isShareLoading,
  shareLink,
  shareOwner,
  shareSettings,
  onApplyLink,
  onConfirmLogout,
  onCopyShareLink,
  onGeneralShareAccessChange,
  onHelpDialogOpenChange,
  onImageDialogOpenChange,
  onImportDialogOpenChange,
  onImportMarkdown,
  onInsertImage,
  onInviteShareEditor,
  onLinkDialogOpenChange,
  onLinkUrlChange,
  onLogoutDialogOpenChange,
  onOpenLinkInNewTabChange,
  onRemoveImage,
  onRemoveLink,
  onShareDialogOpenChange,
}: EditorDialogsStackProps) {
  return (
    <>
      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={onLinkDialogOpenChange}
        linkUrl={linkUrl}
        onLinkUrlChange={onLinkUrlChange}
        openInNewTab={openLinkInNewTab}
        onOpenInNewTabChange={onOpenLinkInNewTabChange}
        onApplyLink={onApplyLink}
        onRemoveLink={onRemoveLink}
      />

      <ImageDialog
        open={imageDialogOpen}
        onOpenChange={onImageDialogOpenChange}
        onInsertImage={onInsertImage}
        onRemoveImage={onRemoveImage}
      />

      <EditorHelpDialog
        open={openHelpDialog}
        onOpenChange={onHelpDialogOpenChange}
      />

      <EditorLogoutDialog
        open={logoutDialogOpen}
        isSubmitting={isLogoutSubmitting}
        onOpenChange={onLogoutDialogOpenChange}
        onConfirmLogout={onConfirmLogout}
      />

      <EditorImportDialog
        open={importDialogOpen}
        onOpenChange={onImportDialogOpenChange}
        onImportMarkdown={onImportMarkdown}
      />

      <EditorShareDialog
        documentTitle={activeDocumentTitle}
        open={openShareDialog}
        owner={shareOwner}
        settings={shareSettings}
        shareLink={shareLink}
        isLoading={isShareLoading}
        onCopyLink={onCopyShareLink}
        onGeneralAccessChange={onGeneralShareAccessChange}
        onInviteEditor={onInviteShareEditor}
        onOpenChange={onShareDialogOpenChange}
      />
    </>
  );
}
