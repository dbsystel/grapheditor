import { useCallback, useRef } from 'react';

export const useDebounce = (timeoutMilliseconds: number) => {
	const timeout = useRef(0);
	const callbackFunction = useCallback((callback: () => void) => {
		if (timeoutMilliseconds > 0) {
			window.clearTimeout(timeout.current);

			timeout.current = window.setTimeout(() => {
				callback();
			}, timeoutMilliseconds);
		} else {
			callback();
		}
	}, []);

	return callbackFunction;
};
