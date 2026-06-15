import type { Metadata } from "next";
import Editor from "@/app/components/editor";
import EditorAuthGate from "./editor-auth-gate";

export const metadata: Metadata = {
  title: "Editor",
};

export default function EditorPage() {
  return (
    <EditorAuthGate>
      <Editor />
    </EditorAuthGate>
  );
}
