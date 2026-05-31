"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "@/utils/api-client";
import type { UseFetchProps } from "@/app/interfaces/use-fetch";

const SUCCESS_STATUS_CODES = [200, 201, 204, 206];

export default function useFetch<Params, Response>({
	request,
	autoFetch = false,
	initialParams,
	onSuccess,
	onError,
}: UseFetchProps<Params, Response>) {
	const paramsRef = useRef<Params | undefined>(initialParams);
	const [data, setData] = useState<Response>();
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isFetched, setIsFetched] = useState(false);

	const fetch = useCallback(
		async (params?: Params) => {
			if (params !== undefined) {
				paramsRef.current = params;
			}

			setIsLoading(true);
			setErrorMessage("");

			try {
				const response = await request(paramsRef.current as Params);
				const isSuccess = SUCCESS_STATUS_CODES.includes(response.status);

				setIsFetched(true);

				if (!isSuccess) {
					throw new Error("Resposta inesperada da API.");
				}

				setData(response.data);
				onSuccess?.(response);

				return response;
			} catch (error) {
				const message = getApiErrorMessage(error);
				setErrorMessage(message);
				onError?.(message, error);
				throw error;
			} finally {
				setIsLoading(false);
			}
		},
		[onError, onSuccess, request],
	);

	useEffect(() => {
		if (autoFetch) {
			fetch(initialParams).catch(() => {
				return;
			});
		}
	}, [autoFetch, fetch, initialParams]);

	return {
		data,
		errorMessage,
		fetch,
		isFetched,
		isLoading,
	};
}