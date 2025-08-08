import { useEffect, useRef } from 'react';
import { Coordinates } from 'sigma/types';
import { preventSigmaCameraMovement } from 'src/components/network-graph/helpers';
import { NodeDragEvent, StateManager } from 'src/components/network-graph/state-manager';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useDebounce } from 'src/utils/hooks/useDebounce';

export const NetworkGraphDragNodes = () => {
	const { unHighlightNodes, isNodeHighlighted, highlightNode, sigma } = useGraphStore(
		(store) => store
	);
	const setNodePosition = useItemsStore((store) => store.setNodePosition);
	const previousCoordinatesRef = useRef<Coordinates>({ x: 0, y: 0 });
	const delayedCallback = useDebounce(200);

	useEffect(() => {
		// enable node dragging
		StateManager.getInstance().on('NODE_DRAG', {
			beforeCallback: nodeDragPreparation,
			callback: mouseMoveBody
		});

		return () => {
			StateManager.getInstance().off('NODE_DRAG', mouseMoveBody);
		};
	}, []);

	const mouseMoveBody = (event: NodeDragEvent) => {
		const graph = sigma.getGraph();
		const previousPosition = previousCoordinatesRef.current;
		const currentPosition = sigma.viewportToGraph(event);

		useGraphStore.getState().highlightedNodeIds.forEach((nodeId) => {
			graph.updateNodeAttribute(nodeId, 'x', (currentX) => {
				return (currentX || 0) + (currentPosition.x - previousPosition.x);
			});
			graph.updateNodeAttribute(nodeId, 'y', (currentY) => {
				return (currentY || 0) + (currentPosition.y - previousPosition.y);
			});

			delayedCallback(() => {
				setNodePosition(
					{
						id: nodeId,
						x: graph.getNodeAttribute(nodeId, 'x'),
						y: graph.getNodeAttribute(nodeId, 'y')
					},
					true
				);
			});
		});

		previousCoordinatesRef.current = currentPosition;

		preventSigmaCameraMovement(event);
	};

	const nodeDragPreparation = (event: NodeDragEvent) => {
		if (!isNodeHighlighted(event.nodeId)) {
			unHighlightNodes();
		}

		highlightNode(event.nodeId);

		previousCoordinatesRef.current = sigma.viewportToGraph(event);
	};

	return null;
};
