"use client";

import { useState } from "react";
import { editorCommands } from "../editor-commands";

type EditorAction = (context: {
  editor: HTMLDivElement;
  savedRange: Range | null;
}) => void;

type UseEditorDialogsParams = {
  updateSavedRange: () => void;
  run: (action: EditorAction) => void;
};

export function useEditorDialogs({
  updateSavedRange,
  run,
}: UseEditorDialogsParams) {
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [openLinkInNewTab, setOpenLinkInNewTab] = useState(true);

  const handleLink = () => {
    updateSavedRange();
    setLinkUrl("https://");
    setOpenLinkInNewTab(true);
    setIsLinkDialogOpen(true);
  };

  const handleApplyLink = () => {
    const href = linkUrl.trim();

    if (!href) {
      return;
    }

    run((context) =>
      editorCommands.link(context, href, { openInNewTab: openLinkInNewTab }),
    );

    setIsLinkDialogOpen(false);
  };

  const handleRemoveLink = () => {
    run((context) => editorCommands.unlink(context));
    setIsLinkDialogOpen(false);
  };

  const handleImage = () => {
    updateSavedRange();
    setIsImageDialogOpen(true);
  };

  const handleInsertImage = (src: string) => {
    run((context) => editorCommands.image(context, src));
    setIsImageDialogOpen(false);
  };

  const handleRemoveImage = () => {
    run((context) => editorCommands.removeImage(context));
    setIsImageDialogOpen(false);
  };

  return {
    isImageDialogOpen,
    setIsImageDialogOpen,
    isLinkDialogOpen,
    setIsLinkDialogOpen,
    linkUrl,
    setLinkUrl,
    openLinkInNewTab,
    setOpenLinkInNewTab,
    handleLink,
    handleApplyLink,
    handleRemoveLink,
    handleImage,
    handleInsertImage,
    handleRemoveImage,
  };
}
