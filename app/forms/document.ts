import type { RegisterOptions } from "react-hook-form";

export type DocumentTitleFormValues = {
	title: string;
};

export const documentTitleDefaultValues: DocumentTitleFormValues = {
	title: "",
};

export const documentTitleFormSchema: Record<
	keyof DocumentTitleFormValues,
	RegisterOptions<DocumentTitleFormValues>
> = {
	title: {
		required: "Informe um nome para o documento",
		validate: (value) =>
			value.trim().length > 0 || "Informe um nome para o documento",
	},
};