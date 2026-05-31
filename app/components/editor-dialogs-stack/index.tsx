import EditorHelpDialog from "../editor-help-dialog";
import EditorImportDialog from "../editor-import-dialog";
import EditorLogoutDialog from "../editor-logout-dialog";
import ImageDialog from "../image-dialog";
import LinkDialog from "../link-dialog";

type EditorDialogsStackProps = {
  imageDialogOpen: boolean;
  importDialogOpen: boolean;
  linkDialogOpen: boolean;
  linkUrl: string;
  logoutDialogOpen: boolean;
  openHelpDialog: boolean;
  openLinkInNewTab: boolean;
  isLogoutSubmitting: boolean;
  onApplyLink: () => void;
  onConfirmLogout: () => void;
  onHelpDialogOpenChange: (open: boolean) => void;
  onImageDialogOpenChange: (open: boolean) => void;
  onImportDialogOpenChange: (open: boolean) => void;
  onImportMarkdown: (markdown: string) => void;
  onInsertImage: (url: string) => void;
  onLinkDialogOpenChange: (open: boolean) => void;
  onLinkUrlChange: (url: string) => void;
  onLogoutDialogOpenChange: (open: boolean) => void;
  onOpenLinkInNewTabChange: (open: boolean) => void;
  onRemoveImage: () => void;
  onRemoveLink: () => void;
};

export default function EditorDialogsStack({
  imageDialogOpen,
  importDialogOpen,
  linkDialogOpen,
  linkUrl,
  logoutDialogOpen,
  openHelpDialog,
  openLinkInNewTab,
  isLogoutSubmitting,
  onApplyLink,
  onConfirmLogout,
  onHelpDialogOpenChange,
  onImageDialogOpenChange,
  onImportDialogOpenChange,
  onImportMarkdown,
  onInsertImage,
  onLinkDialogOpenChange,
  onLinkUrlChange,
  onLogoutDialogOpenChange,
  onOpenLinkInNewTabChange,
  onRemoveImage,
  onRemoveLink,
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
    </>
  );
}
