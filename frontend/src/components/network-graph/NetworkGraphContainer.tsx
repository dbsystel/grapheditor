import { MultiDirectedGraph } from 'graphology';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import Sigma from 'sigma';
import { clearCanvasContexts } from 'src/components/network-graph/helpers';
import {
	GraphEditorSigmaNodeAttributes,
	GraphEditorSigmaRelationAttributes
} from 'src/components/network-graph/NetworkGraph.interfaces';
import { drawNodeHover } from 'src/components/network-graph/overrides/nodes/hover/node-hover';
import { drawNodeLabel } from 'src/components/network-graph/overrides/nodes/labels/draw-node-label';
import { drawRelationLabel } from 'src/components/network-graph/overrides/relations/straight/edge-labels';
import { SquareNodeWithBorderProgram } from 'src/components/network-graph/programs/nodes/squareWithBorder';
import { CurvedEdgeArrowProgram } from 'src/components/network-graph/programs/relations/curved';
import { StraightEdgeArrowProgram } from 'src/components/network-graph/programs/relations/straight';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useGraphStore } from 'src/stores/graph';
import {
	GRAPH_DEFAULT_EDGE_LABEL_FONT,
	GRAPH_DEFAULT_EDGE_LABEL_SIZE,
	GRAPH_DEFAULT_EDGE_LABEL_WEIGHT,
	GRAPH_DEFAULT_EDGE_MIN_THICKNESS,
	GRAPH_DEFAULT_LABEL_RENDERED_SIZE_THRESHOLD,
	GRAPH_DEFAULT_NODE_LABEL_FONT,
	GRAPH_DEFAULT_NODE_LABEL_SIZE,
	GRAPH_DEFAULT_NODE_LABEL_WEIGHT
} from 'src/utils/constants';

export const NetworkGraphContainer = ({ children }: PropsWithChildren) => {
	const setSigma = useGraphStore((store) => store.setSigma);
	const setIsSigmaReady = useGraphStore((store) => store.setIsSigmaReady);
	const resetButExclude = useGraphStore((store) => store.resetButExclude);
	const [graphSigmaIsSet, setGraphSigmaIsSet] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const element = containerRef.current;

		if (element) {
			const sigma = new Sigma<
				GraphEditorSigmaNodeAttributes,
				GraphEditorSigmaRelationAttributes
			>(new MultiDirectedGraph(), element, {
				enableEdgeEvents: true,
				// minimum node size required to render its label (it affects relation labels as well)
				labelRenderedSizeThreshold: GRAPH_DEFAULT_LABEL_RENDERED_SIZE_THRESHOLD,
				renderEdgeLabels: true,
				autoRescale: false,
				zoomToSizeRatioFunction: (ratio: number) => ratio,
				labelFont: GRAPH_DEFAULT_NODE_LABEL_FONT,
				labelWeight: GRAPH_DEFAULT_NODE_LABEL_WEIGHT,
				labelSize: GRAPH_DEFAULT_NODE_LABEL_SIZE,
				edgeLabelFont: GRAPH_DEFAULT_EDGE_LABEL_FONT,
				edgeLabelWeight: GRAPH_DEFAULT_EDGE_LABEL_WEIGHT,
				edgeLabelSize: GRAPH_DEFAULT_EDGE_LABEL_SIZE,
				defaultNodeType: 'squareWithBorder',
				defaultDrawNodeHover: drawNodeHover,
				defaultDrawNodeLabel: drawNodeLabel,
				defaultDrawEdgeLabel: drawRelationLabel,
				nodeProgramClasses: {
					squareWithBorder: SquareNodeWithBorderProgram
				},
				edgeProgramClasses: {
					straight: StraightEdgeArrowProgram,
					curved: CurvedEdgeArrowProgram
				},
				zoomingRatio: useGraphStore.getState().zoomFactor,
				minEdgeThickness: GRAPH_DEFAULT_EDGE_MIN_THICKNESS,
				allowInvalidContainer: true
			});

			setSigma(sigma);
			setIsSigmaReady(true);

			// assign sigma to the StateManager
			StateManager.getInstance().setSigma(sigma);

			setGraphSigmaIsSet(true);

			(window as any).sigma = sigma;
		}

		return () => {
			if (useGraphStore.getState().isSigmaReady) {
				const sigmaToClear = useGraphStore.getState().sigma;
				/**
				 * Because the "kill" Sigma.js method just sets its canvas collections
				 * to an empty object (this.canvasContexts = {}; this.webGLContexts = {};),
				 * those contexts remain in the memory for some time until the garbage
				 * collector clears them. Since we might create new Sigma instances
				 * until the GC does its cleaning, we have to manually clear those
				 * contexts.
				 */
				const canvases = sigmaToClear.getCanvases();
				const canvasElements = Object.values(canvases);

				clearCanvasContexts(canvasElements);

				sigmaToClear.kill();

				resetButExclude(['perspectiveId', 'perspectiveName']);
			}
		};
	}, []);

	return (
		<div className="network-graph__container" ref={containerRef}>
			{graphSigmaIsSet && children}
		</div>
	);
};
