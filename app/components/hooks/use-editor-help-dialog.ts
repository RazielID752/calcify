import { useCallback, useEffect, useState } from "react";
import { HELP_DIALOG_STORAGE_KEY } from "../editor-document";

export const useEditorHelpDialog = () => {
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return localStorage.getItem(HELP_DIALOG_STORAGE_KEY) !== "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isHelpDialogOpen) {
      return;
    }

    try {
      localStorage.setItem(HELP_DIALOG_STORAGE_KEY, "1");
    } catch {
      // Ignore storage errors to avoid breaking editor usage.
    }
  }, [isHelpDialogOpen]);

  const handleOpenHelpFromMenu = useCallback(() => {
    setIsHelpDialogOpen(true);
  }, []);

  return {
    handleOpenHelpFromMenu,
    isHelpDialogOpen,
    setIsHelpDialogOpen,
  };
};
