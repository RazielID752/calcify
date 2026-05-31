"use client";

import { useCallback } from "react";
import { toast } from "sonner";

type SonnerOptions = {
	description?: string;
};

export default function useSonner() {
	const success = useCallback((message: string, options?: SonnerOptions) => {
		return options?.description
			? toast.success(message, { description: options.description })
			: toast.success(message);
	}, []);

	const error = useCallback((message: string, options?: SonnerOptions) => {
		return options?.description
			? toast.error(message, { description: options.description })
			: toast.error(message);
	}, []);

	return {
		error,
		success,
	};
}