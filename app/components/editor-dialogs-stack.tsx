import EditorHelpDialog from "./editor-help-dialog";
import EditorImportDialog from "./editor-import-dialog";
import EditorLoginDialog from "./editor-login-dialog";
import EditorLogoutDialog from "./editor-logout-dialog";
import ImageDialog from "./image-dialog";
import LinkDialog from "./link-dialog";

type EditorDialogsStackProps = {
  imageDialogOpen: boolean;
  importDialogOpen: boolean;
  linkDialogOpen: boolean;
  linkUrl: string;
  loginDialogOpen: boolean;
  loginErrorMessage: string;
  logoutDialogOpen: boolean;
  openHelpDialog: boolean;
  openLinkInNewTab: boolean;
  isLoginSubmitting: boolean;
  isLogoutSubmitting: boolean;
  onApplyLink: () => void;
  onConfirmLogout: () => void;
  onContinueLogin: (credentials: { login: string; password: string }) => void;
  onHelpDialogOpenChange: (open: boolean) => void;
  onImageDialogOpenChange: (open: boolean) => void;
  onImportDialogOpenChange: (open: boolean) => void;
  onImportMarkdown: (markdown: string) => void;
  onInsertImage: (url: string) => void;
  onLinkDialogOpenChange: (open: boolean) => void;
  onLinkUrlChange: (url: string) => void;
  onLoginDialogOpenChange: (open: boolean) => void;
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
  loginDialogOpen,
  loginErrorMessage,
  logoutDialogOpen,
  openHelpDialog,
  openLinkInNewTab,
  isLoginSubmitting,
  isLogoutSubmitting,
  onApplyLink,
  onConfirmLogout,
  onContinueLogin,
  onHelpDialogOpenChange,
  onImageDialogOpenChange,
  onImportDialogOpenChange,
  onImportMarkdown,
  onInsertImage,
  onLinkDialogOpenChange,
  onLinkUrlChange,
  onLoginDialogOpenChange,
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

      <EditorLoginDialog
        open={loginDialogOpen}
        onOpenChange={onLoginDialogOpenChange}
        onContinueLogin={onContinueLogin}
        isSubmitting={isLoginSubmitting}
        errorMessage={loginErrorMessage}
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
