import {
	useEditorAccountSync,
	type UseEditorAccountSyncOptions,
} from "./use-editor-account-sync";

export type UseEditorOptions = UseEditorAccountSyncOptions;

export function useEditor(options: UseEditorOptions) {
	return useEditorAccountSync(options);
}