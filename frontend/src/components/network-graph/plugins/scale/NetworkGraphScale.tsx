import { getNodesInViewport } from '@sigma/utils';
import { useEffect, useRef } from 'react';
import Sigma from 'sigma';
import { CameraState, WheelCoords } from 'sigma/types';
import { calculateNodeGraphSize } from 'src/components/network-graph/helpers';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useGraphStore } from 'src/stores/graph';
import {
	GRAPH_DEFAULT_EDGE_LABEL_SIZE,
	GRAPH_DEFAULT_LABEL_RENDERED_SIZE_THRESHOLD,
	GRAPH_DEFAULT_NODE_LABEL_SIZE,
	GRAPH_HIDE_ALL_LABELS_THRESHOLD
} from 'src/utils/constants';

export const NetworkGraphScale = () => {
	const sigma = useGraphStore((store) => store.sigma);
	const getNodeSizeFactor = useGraphStore((store) => store.getNodeSizeFactor);
	const setNodeSizeFactor = useGraphStore((store) => store.setNodeSizeFactor);

	const defaultDataRef = useRef({
		nodeLabelSize: sigma.getSetting('labelSize') || GRAPH_DEFAULT_NODE_LABEL_SIZE,
		relationLabelSize: sigma.getSetting('edgeLabelSize') || GRAPH_DEFAULT_EDGE_LABEL_SIZE,
		cameraRatio: sigma.getCamera().ratio,
		labelsRendered: true,
		labelSizeFactor: 1
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

	const toggleLabelsVisibility = () => {
		// TODO check if fixable somehow else
		// getNodesInViewport hardcoded Sigma as type
		const nodesInViewport = getNodesInViewport(sigma as unknown as Sigma);
		const nodeLabelsInViewport = sigma.getNodeDisplayedLabels();
		const relationLabelsInViewport = sigma.getEdgeDisplayedLabels();

		if (
			nodeLabelsInViewport.size + relationLabelsInViewport.size >
				GRAPH_HIDE_ALL_LABELS_THRESHOLD ||
			nodesInViewport.length > GRAPH_HIDE_ALL_LABELS_THRESHOLD
		) {
			if (defaultDataRef.current.labelsRendered) {
				defaultDataRef.current.labelsRendered = false;
				sigma.setSetting('labelRenderedSizeThreshold', 10000000);
			}
		} else {
			if (!defaultDataRef.current.labelsRendered) {
				defaultDataRef.current.labelsRendered = true;
				sigma.setSetting(
					'labelRenderedSizeThreshold',
					GRAPH_DEFAULT_LABEL_RENDERED_SIZE_THRESHOLD
				);
			}
		}
	};

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

	const resizeLabels = () => {
		const camera = sigma.getCamera();
		const { nodeLabelSize, relationLabelSize, labelSizeFactor } = defaultDataRef.current;

		sigma.updateSetting('labelSize', () => (nodeLabelSize / camera.ratio) * labelSizeFactor);
		sigma.updateSetting(
			'edgeLabelSize',
			() => (relationLabelSize / camera.ratio) * labelSizeFactor
		);

		toggleLabelsVisibility();
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
			defaultDataRef.current.labelSizeFactor += 0.1;
		}
		// scroll down / zoom out
		else {
			defaultDataRef.current.labelSizeFactor -= 0.1;
		}

		resizeLabels();
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
