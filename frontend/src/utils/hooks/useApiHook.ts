import type { AxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';

type UseApiHookParams<ResponseType, FetchParametersType, FetchErrorType> = {
	executeImmediately?: boolean;
	onSuccess?: (data: ResponseType) => void;
	onError?: (error: FetchErrorType) => void;
	onFinally?: () => void;
	fetchFunction: (parameters?: FetchParametersType) => Promise<ResponseType>;
	dependencies?: Array<unknown>;
	waitBeforeReFetch?: boolean;
};

/**
 * Custom hook to perform API calls.
 * Since useApiHook props/fetch function parameters are lightweight (they don't performing heavy calculations or similar), only
 * internal states are cached, the rest not.
 *
 */
export const useApiHook = <ResponseType, FetchParametersType = never, FetchErrorType = AxiosError>({
	executeImmediately = true,
	onSuccess,
	onError,
	onFinally,
	fetchFunction,
	dependencies = [],
	waitBeforeReFetch
}: UseApiHookParams<ResponseType, FetchParametersType, FetchErrorType>) => {
	const [response, setResponse] = useState<ResponseType | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(executeImmediately);
	const [error, setError] = useState<FetchErrorType | null>(null);
	// in order to block executing same multiple parallel API calls, we need to
	// track the number of ongoing API calls due to the "executeImmediately" option,
	// otherwise we could just check if "isLoading" is "true"
	const fetchCountRef = useRef(0);

	const fetchData = (parameters?: FetchParametersType) => {
		if (fetchCountRef.current === 1 && waitBeforeReFetch) {
			return;
		}

		fetchCountRef.current += 1;

		setIsLoading(true);
		setError(null);
		setResponse(null);

		// states are updated in .then and .catch methods instead of the .finally in order
		// to prevent one extra re-render, because the .finally method is executed after the
		// states have been updated
		fetchFunction(parameters)
			.then((res) => {
				setResponse(res);
				setIsLoading(false);

				if (onSuccess) {
					onSuccess(res);
				}
			})
			.catch((error: FetchErrorType) => {
				setError(error);
				setIsLoading(false);

				if (onError) {
					onError(error);
				}

				Promise.reject(error);
			})
			.finally(() => {
				fetchCountRef.current -= 1;

				if (onFinally) {
					onFinally();
				}
			});
	};

	useEffect(() => {
		if (executeImmediately) {
			fetchData();
		}
	}, dependencies);

	return {
		response,
		error,
		isLoading,
		reFetch: fetchData
	};
};
