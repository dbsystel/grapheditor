import { useEffect, useRef } from 'react';
import { CameraState, WheelCoords } from 'sigma/types';
import { calculateNodeGraphSize } from 'src/components/network-graph/helpers';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useGraphStore } from 'src/stores/graph';
import { GRAPH_DEFAULT_FONT_SIZE_FACTOR } from 'src/utils/constants';

export const NetworkGraphScale = () => {
	const sigma = useGraphStore((store) => store.sigma);
	const getNodeSizeFactor = useGraphStore((store) => store.getNodeSizeFactor);
	const setNodeSizeFactor = useGraphStore((store) => store.setNodeSizeFactor);
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

	useEffect(() => {
		StateManager.getInstance().on('CAMERA_UPDATE', onCameraUpdate);
		StateManager.getInstance().on('SCALE', onScale);

		return () => {
			StateManager.getInstance().off('CAMERA_UPDATE', onCameraUpdate);
			StateManager.getInstance().off('SCALE', onScale);
		};
	}, []);

	const onCameraUpdate = (state: CameraState) => {
		// camera zoom in/out - resize labels on each camera ratio (zoom) change
		// so they scale with the zoom
		if (state.ratio !== defaultDataRef.current.cameraRatio) {
			defaultDataRef.current.cameraRatio = state.ratio;

			resizeLabels();
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

	const onScale = (event: WheelCoords) => {
		if (event.original.shiftKey || event.original.altKey) {
			if (event.delta > 0 || event.delta < 0) {
				sigma.getCamera().disable();

				if (event.original.shiftKey) {
					onLabelScale(event);
				}
				if (event.original.altKey) {
					onNodeScale(event);
				}

				sigma.once('afterRender', () => {
					sigma.getCamera().enable();
					StateManager.getInstance().resetState();
				});
			}
		}
	};

	const onLabelScale = (event: WheelCoords) => {
		// scroll up / zoom in
		if (event.delta > 0) {
			increaseLabelFontSizeFactor();
		}
		// scroll down / zoom out
		else {
			decreaseLabelFontSizeFactor();
		}
	};

	const onNodeScale = (event: WheelCoords) => {
		// scroll up / zoom in
		if (event.delta > 0) {
			setNodeSizeFactor(getNodeSizeFactor() + 0.1);
		}
		// scroll down / zoom out
		else {
			setNodeSizeFactor(getNodeSizeFactor() - 0.1);
		}

		resizeNodes();
	};

	const resizeNodes = () => {
		sigma.getGraph().forEachNode((nodeId, attributes) => {
			if (attributes.data) {
				sigma
					.getGraph()
					.setNodeAttribute(
						nodeId,
						'size',
						calculateNodeGraphSize(parseFloat(attributes.data.style.diameter))
					);
			}
		});
	};

	return null;
};
