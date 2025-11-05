import { calculateBoundingBoxCenterByCoordinates } from 'src/components/network-graph/helpers';
import { Point } from 'src/models/graph';
import { NodeId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';

// TODO currently we don't scale values, check if that is ok (the applyLayoutToFollowingNodesAction's
//  logic scales values, discuss in team which approach to take)
export const applyLayoutAction = (direction: 'horizontal' | 'vertical') => {
	const nodeIds = useContextMenuStore.getState().nodeIds;
	const sigma = useGraphStore.getState().sigma;
	const graph = sigma.getGraph();
	const distanceBetweenNodes = 50;
	const nodeData: Array<{ id: NodeId; size: number } & Point> = [];
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;
	let sizeSum = 0;

	nodeIds.forEach((nodeId) => {
		const x = graph.getNodeAttribute(nodeId, 'x');
		const y = graph.getNodeAttribute(nodeId, 'y');
		const size = graph.getNodeAttribute(nodeId, 'size');

		minX = Math.min(minX, x);
		maxX = Math.max(maxX, x);
		minY = Math.min(minY, y);
		maxY = Math.max(maxY, y);

		sizeSum += size;

		nodeData.push({
			id: nodeId,
			size: size,
			x: x,
			y: y
		});
	});

	if (direction === 'horizontal') {
		// ascending horizontal sort
		nodeData.sort((a, b) => {
			return a.x - b.x;
		});
	} else if (direction === 'vertical') {
		// ascending vertical sort
		nodeData.sort((a, b) => {
			return a.y - b.y;
		});
	}

	const center = calculateBoundingBoxCenterByCoordinates(nodeData);

	nodeIds.forEach((nodeId) => {
		if (direction === 'horizontal') {
			graph.setNodeAttribute(nodeId, 'y', center.y);
		} else if (direction === 'vertical') {
			graph.setNodeAttribute(nodeId, 'x', center.x);
		}
	});

	const startPointValue = direction === 'horizontal' ? center.x : center.y;
	let pointValue = startPointValue - sizeSum - (distanceBetweenNodes / 2) * (nodeIds.length - 1);

	nodeData.forEach((nodeEntry, index) => {
		if (direction === 'horizontal') {
			graph.setNodeAttribute(nodeEntry.id, 'x', pointValue);
		} else if (direction === 'vertical') {
			graph.setNodeAttribute(nodeEntry.id, 'y', pointValue);
		}

		pointValue += nodeEntry.size + distanceBetweenNodes + (nodeData.at(index + 1)?.size || 0);
	});
};
