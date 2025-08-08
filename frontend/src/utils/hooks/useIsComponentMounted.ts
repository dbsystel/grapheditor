import { useEffect, useRef } from 'react';

// custom hook to check if component is mounted
export const useIsComponentMounted = () => {
	const isMounted = useRef(false);

	useEffect(() => {
		isMounted.current = true;
	}, []);

	return isMounted.current;
};
