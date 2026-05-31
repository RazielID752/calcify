import type { AxiosResponse } from "axios";

export type UseFetchProps<Params, Response> = {
	request: (params: Params) => Promise<AxiosResponse<Response>>;
	autoFetch?: boolean;
	initialParams?: Params;
	onSuccess?: (response: AxiosResponse<Response>) => void;
	onError?: (message: string, error: unknown) => void;
};