import { useEffect } from 'react';
import { WheelCoords } from 'sigma/types';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useGraphStore } from 'src/stores/graph';

export const NetworkGraphQuickZoomFactor = () => {
	const {
		sigma,
		zoomFactor,
		setZoomFactor,
		zoomFactorStep: zoomFactorIncrementBy,
		zoomFactorMin,
		zoomFactorMax
	} = useGraphStore((store) => store);

	useEffect(() => {
		StateManager.getInstance().on('ZOOM_FACTOR', onZoomFactor);

		return () => {
			StateManager.getInstance().off('ZOOM_FACTOR', onZoomFactor);
		};
	}, [zoomFactor]);

	const onZoomFactor = (event: WheelCoords) => {
		let newZoomFactor =
			zoomFactor + (event.delta > 0 ? zoomFactorIncrementBy : -zoomFactorIncrementBy);
		newZoomFactor = Number(newZoomFactor.toFixed(1));

		/**
		 * If the new zoom factor is either too small or too big,
		 * we have two options how to keep the default camera zoom
		 * functionality disabled:
		 * 1. - combine below two "if" conditions into one
		 * 	  - disable the camera
		 * 	  - use timeout to enable the camera and reset State Manager state
		 * 	  - break further code execution (e.g. use "return")
		 *
		 * 2. -	adjust the new zoom factor accordingly
		 * 	  - let the code flow works the same, regardless if the zoom factor
		 * 	  	has been changed or not
		 *
		 * The option number 2 is easier to follow, and we have less Sigma/State Manager
		 * state managing.
		 */

		if (newZoomFactor < zoomFactorMin) {
			newZoomFactor = zoomFactorMin;
		}

		if (newZoomFactor > zoomFactorMax) {
			newZoomFactor = zoomFactorMax;
		}

		sigma.getCamera().disable();

		setZoomFactor(Number(newZoomFactor.toFixed(1)));

		sigma.once('afterRender', () => {
			setTimeout(() => {
				sigma.getCamera().enable();
				StateManager.getInstance().resetState();
			});
		});
	};

	return null;
};
