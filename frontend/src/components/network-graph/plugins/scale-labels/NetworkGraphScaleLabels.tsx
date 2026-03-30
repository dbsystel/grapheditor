import { useEffect, useRef } from 'react';
import { CameraState, WheelCoords } from 'sigma/types';
import {
	disableSigmaMouseCaptor,
	enableSigmaMouseCaptor
} from 'src/components/network-graph/helpers';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useGraphStore } from 'src/stores/graph';
import { GRAPH_DEFAULT_FONT_SIZE_FACTOR } from 'src/utils/constants';
import { useDebounce } from 'src/utils/hooks/useDebounce';

export const NetworkGraphScaleLabels = () => {
	const sigma = useGraphStore((store) => store.sigma);
	const toggleLabelsVisibility = useGraphStore((store) => store.toggleLabelsVisibility);
	const resizeLabels = useGraphStore((store) => store.resizeLabels);
	const increaseLabelFontSizeFactor = useGraphStore((store) => store.increaseLabelFontSizeFactor);
	const decreaseLabelFontSizeFactor = useGraphStore((store) => store.decreaseLabelFontSizeFactor);
	const defaultDataRef = useRef({
		labelFontSizeFactor:
			useGraphStore((store) => store.labelFontSizeFactor) || GRAPH_DEFAULT_FONT_SIZE_FACTOR,
		cameraRatio: sigma.getCamera().ratio
	});
	const toggleLabelsVisibilityTimeoutRef = useRef(0);
	const delayedCallback = useDebounce(100);

	useEffect(() => {
		StateManager.getInstance().subscribe('cameraUpdate', onCameraUpdate);
		StateManager.getInstance().subscribe('scaleLabels', onScaleLabels);

		return () => {
			StateManager.getInstance().unsubscribe('cameraUpdate', onCameraUpdate);
			StateManager.getInstance().unsubscribe('scaleLabels', onScaleLabels);
		};
	}, [sigma]);

	const onCameraUpdate = (state: CameraState) => {
		// camera zoom in/out - resize labels on each camera ratio (zoom) change
		// so they scale with the zoom
		if (state.ratio !== defaultDataRef.current.cameraRatio) {
			/**
			 * If zoomingRatio was bigger and a person would click while zoom animation is not done,
			 * all graph nodes would be scaled down. sigma.getCamera().isAnimated() wasn't reliable,
			 * the current solution (disabling and enabling events triggered by mouse) seems to be
			 * working fine.
			 */
			disableSigmaMouseCaptor();

			defaultDataRef.current.cameraRatio = state.ratio;

			resizeLabels();
			delayedCallback(enableSigmaMouseCaptor);
		}
		// camera move
		else {
			window.clearTimeout(toggleLabelsVisibilityTimeoutRef.current);

			toggleLabelsVisibilityTimeoutRef.current = window.setTimeout(
				toggleLabelsVisibility,
				50
			);
		}
	};

	const onScaleLabels = (event: WheelCoords) => {
		if (event.delta > 0 || event.delta < 0) {
			sigma.getCamera().disable();

			// scroll up / zoom in
			if (event.delta > 0) {
				increaseLabelFontSizeFactor();
			}
			// scroll down / zoom out
			else {
				decreaseLabelFontSizeFactor();
			}

			sigma.once('afterRender', () => {
				sigma.getCamera().enable();
				StateManager.getInstance().resetState();
			});
		}
	};

	return null;
};
