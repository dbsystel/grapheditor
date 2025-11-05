import {
	calculateBoundingBoxCenterByCoordinates,
	getCoordinatesPointRelativeToTargetPoint
} from 'src/components/network-graph/helpers';
import { Point } from 'src/models/graph';
import { NodeId } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { useClipboardStore } from 'src/stores/clipboard';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { nodesApi } from 'src/utils/api/nodes';
import { relationsApi } from 'src/utils/api/relations';
import { PostRelationsParameters } from 'src/utils/fetch/postRelations';
import { parseError } from 'src/utils/helpers/general';

export const duplicateCopiedAction = async () => {
	const clipboardNodes = useClipboardStore.getState().clipboard.graphNodes;
	const clipboardRelations = useClipboardStore.getState().clipboard.graphRelations;

	useContextMenuStore.getState().setIsActionLoading(true);

	try {
		// duplicate nodes
		const newNodesResponse = await nodesApi.postNodes(
			clipboardNodes.map((clipboardNode) => {
				return {
					labels: clipboardNode.attributes.data.labels,
					properties: clipboardNode.attributes.data.properties
				};
			})
		);
		const newNodes = Object.values(newNodesResponse.data.nodes);
		const oldNewNodeIdsRecord: Record<NodeId, NodeId | null> = {};

		// map new node IDs to old node IDs
		newNodes.forEach((newNode, index) => {
			const clipboardGraphNode = clipboardNodes.at(index);

			if (clipboardGraphNode) {
				oldNewNodeIdsRecord[clipboardGraphNode.node] = newNode.id;
			}
		});

		let newRelations: Array<Relation> = [];

		if (clipboardRelations.length) {
			const relationsToDuplicate: PostRelationsParameters = [];

			// use new node IDs for new relations source and target
			clipboardRelations.forEach((clipboardRelation) => {
				const newSourceId =
					oldNewNodeIdsRecord[clipboardRelation.attributes.data.source_id];
				const newTargetId =
					oldNewNodeIdsRecord[clipboardRelation.attributes.data.target_id];

				if (newSourceId && newTargetId) {
					relationsToDuplicate.push({
						type: clipboardRelation.attributes.data.type,
						properties: clipboardRelation.attributes.data.properties,
						sourceId: newSourceId,
						targetId: newTargetId
					});
				}
			});

			const newRelationsResponse = await relationsApi.postRelations(relationsToDuplicate);
			newRelations = Object.values(newRelationsResponse.data.relations);
		}

		const event = useContextMenuStore.getState().event;
		const coordinates: Record<NodeId, Point> = {};

		clipboardNodes.forEach((graphNode) => {
			coordinates[graphNode.node] = {
				x: graphNode.attributes.x || 0,
				y: graphNode.attributes.y || 0
			};
		});

		const boundingBoxCenter = calculateBoundingBoxCenterByCoordinates(
			Object.values(coordinates)
		);

		if (event && 'event' in event) {
			const eventCoordinates = useGraphStore.getState().sigma.viewportToGraph(event.event);

			newNodes.forEach((newNode, index) => {
				const clipboardGraphNode = clipboardNodes.at(index);

				if (clipboardGraphNode) {
					const newPoint = getCoordinatesPointRelativeToTargetPoint(
						{
							x: clipboardGraphNode.attributes.x,
							y: clipboardGraphNode.attributes.y
						},
						boundingBoxCenter,
						eventCoordinates
					);

					newNode.style.x = newPoint.x.toString();
					newNode.style.y = newPoint.y.toString();
				}
			});

			useItemsStore.getState().setNodes(newNodes, true);
			useGraphStore.getState().addNodes(newNodes);

			if (newRelations.length) {
				useItemsStore.getState().setRelations(newRelations, true);
				useGraphStore.getState().addRelations(newRelations);

				useGraphStore.getState().indexParallelRelations();
				useGraphStore.getState().adaptRelationsTypeAndCurvature();
			}

			if (newNodes.length || newRelations.length) {
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
