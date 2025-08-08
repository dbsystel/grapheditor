import { useEffect } from 'react';

export const useOnFullscreenChange = (callback?: (isCurrentScreenFullscreen: boolean) => void) => {
	const onFullscreenChange = () => {
		if (callback) {
			callback(!!document.fullscreenElement);
		}
	};

	useEffect(() => {
		document.addEventListener('fullscreenchange', onFullscreenChange);

		return () => {
			document.removeEventListener('fullscreenchange', onFullscreenChange);
		};
	}, []);
};
