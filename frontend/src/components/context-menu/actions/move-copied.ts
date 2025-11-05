import {
	calculateBoundingBoxCenterByCoordinates,
	getCoordinatesPointRelativeToTargetPoint
} from 'src/components/network-graph/helpers';
import { Point } from 'src/models/graph';
import { NodeId } from 'src/models/node';
import { useClipboardStore } from 'src/stores/clipboard';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { nodesApi } from 'src/utils/api/nodes';
import { relationsApi } from 'src/utils/api/relations';
import { parseError } from 'src/utils/helpers/general';

// take coordinates from clipboard
// tooltip z-index
export const moveCopiedAction = async () => {
	useContextMenuStore.getState().setIsActionLoading(true);

	try {
		const clipboardNodes = useClipboardStore.getState().clipboard.graphNodes;
		const clipboardNodeIds = clipboardNodes.map((nodeEntry) => nodeEntry.attributes.data.id);
		const clipboardRelationIds = useClipboardStore
			.getState()
			.clipboard.graphRelations.map((relationEntry) => {
				return relationEntry.attributes.data.id;
			});
		const event = useContextMenuStore.getState().event;

		if (event && 'event' in event) {
			const sigma = useGraphStore.getState().sigma;
			const graph = useGraphStore.getState().sigma.getGraph();
			const eventCoordinates = useGraphStore.getState().sigma.viewportToGraph(event.event);
			const coordinates: Record<NodeId, Point> = {};
			const missingNodeIds = clipboardNodeIds.filter((clipboardNodeId) => {
				return !graph.hasNode(clipboardNodeId);
			});
			const missingRelationIds = clipboardRelationIds.filter((clipboardRelationId) => {
				return !graph.hasEdge(clipboardRelationId);
			});
			let numberOfNewItems = 0;

			// fetch missing nodes
			if (missingNodeIds.length) {
				const missingNodes = await nodesApi.postNodesBulkFetch({ nodeIds: missingNodeIds });

				useItemsStore.getState().setNodes(missingNodes, true);
				useGraphStore.getState().addNodes(missingNodes);

				numberOfNewItems += missingNodes.length;
			}

			// fetch missing relations
			if (missingRelationIds.length) {
				const missingRelationsResponse = await relationsApi.postRelationsBulkFetch({
					relationIds: missingRelationIds
				});
				const missingRelations = Object.values(missingRelationsResponse.data.relations);

				numberOfNewItems += missingRelations.length;

				useItemsStore.getState().setRelations(missingRelations, true);
				useGraphStore.getState().addRelations(missingRelations);
			}

			clipboardNodeIds.forEach((nodeId) => {
				if (sigma.getGraph().hasNode(nodeId)) {
					let x = 0;
					let y = 0;

					// for missing nodes use the coordinates from the clipboard (team decision)
					if (missingNodeIds.includes(nodeId)) {
						const clipboardNode = clipboardNodes.find(
							(clipboardNode) => clipboardNode.node === nodeId
						);

						if (clipboardNode) {
							x = clipboardNode.attributes.x;
							y = clipboardNode.attributes.y;
						}
					} else {
						x = graph.getNodeAttribute(nodeId, 'x') || 0;
						y = graph.getNodeAttribute(nodeId, 'y') || 0;
					}

					coordinates[nodeId] = {
						x: x,
						y: y
					};
				}
			});

			const boundingBoxCenter = calculateBoundingBoxCenterByCoordinates(
				Object.values(coordinates)
			);

			clipboardNodeIds.forEach((nodeId) => {
				if (sigma.getGraph().hasNode(nodeId)) {
					const point = coordinates[nodeId];

					const newPoint = getCoordinatesPointRelativeToTargetPoint(
						{ x: point.x, y: point.y },
						boundingBoxCenter,
						eventCoordinates
					);

					useGraphStore.getState().setNodePosition(nodeId, {
						x: newPoint.x,
						y: newPoint.y
					});

					useItemsStore.getState().setNodePosition(
						nodeId,
						{
							x: newPoint.x,
							y: newPoint.y
						},
						true
					);
				}
			});

			if (numberOfNewItems > 0) {
				useItemsStore.getState().refreshNodesAndRelations();
			}
		}
	} catch (error: unknown) {
		useNotificationsStore.getState().addNotification({
			title: parseError(error),
			type: 'critical'
		});
	}

	useContextMenuStore.getState().setIsActionLoading(false);
	useContextMenuStore.getState().close();
};
