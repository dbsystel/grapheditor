import { calculateNodeGraphSize } from 'src/components/network-graph/helpers';
import { NodeId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';

export const applyLayoutToFollowingNodesAction = (
	nodeId: NodeId,
	direction: 'horizontal' | 'vertical'
) => {
	const followingNodeIds: Array<string> = [];
	const sigma = useGraphStore.getState().sigma;
	const graph = sigma.getGraph();
	const startNodeData = {
		x: graph.getNodeAttribute(nodeId, 'x'),
		y: graph.getNodeAttribute(nodeId, 'y'),
		size: graph.getNodeAttribute(nodeId, 'size')
	};

	// after scaling this value will match .grass file node diameter value,
	// meaning 50 here is like "diameter: 50px" in .grass
	const distanceBetweenNodes = 50;

	const getNodeNeighbors = (nodeId: NodeId) => {
		const neighbors = graph.outNeighbors(nodeId);

		neighbors.forEach((neighborId) => {
			// possibly prevent cyclic references (needs to be tested)
			if (!followingNodeIds.includes(neighborId)) {
				followingNodeIds.push(neighborId);
				getNodeNeighbors(neighborId);
			}
		});
	};

	getNodeNeighbors(nodeId);

	if (followingNodeIds.length) {
		useGraphStore.getState().unHighlightNodes();
		useGraphStore.getState().highlightNode(nodeId);

		const scaledNodeDistance = sigma.scaleSize(
			calculateNodeGraphSize(distanceBetweenNodes * 2)
		);
		let offset = 0;

		// move on x-axis either to the right (1) or to the left (-1)
		const horizontalSign =
			graph.getNodeAttribute(followingNodeIds[0], 'x') > startNodeData.x ? 1 : -1;
		// move on y-axis either up (1) or down (-1)
		const verticalSign =
			graph.getNodeAttribute(followingNodeIds[0], 'y') > startNodeData.y ? 1 : -1;
		const sign = direction === 'horizontal' ? horizontalSign : verticalSign;

		// #1 offset start value
		offset = direction === 'horizontal' ? startNodeData.x : startNodeData.y;
		// #2 move offset to the start node edge
		offset += (sigma.scaleSize(startNodeData.size) / sigma.getGraphToViewportRatio()) * sign;

		followingNodeIds.forEach((followingNodeId) => {
			const followingNodeSize = graph.getNodeAttribute(followingNodeId, 'size');

			// #3 add wanted distance to offset
			offset +=
				((scaledNodeDistance + sigma.scaleSize(followingNodeSize)) /
					sigma.getGraphToViewportRatio()) *
				sign;

			if (direction === 'horizontal') {
				graph.setNodeAttribute(followingNodeId, 'x', offset);
				graph.setNodeAttribute(followingNodeId, 'y', startNodeData.y);
			} else {
				graph.setNodeAttribute(followingNodeId, 'x', startNodeData.x);
				graph.setNodeAttribute(followingNodeId, 'y', offset);
			}

			// #4 move offset to the current node edge
			offset += (sigma.scaleSize(followingNodeSize) / sigma.getGraphToViewportRatio()) * sign;

			useGraphStore.getState().highlightNode(followingNodeId);
			useContextMenuStore.getState().close();
		});
	}
};
