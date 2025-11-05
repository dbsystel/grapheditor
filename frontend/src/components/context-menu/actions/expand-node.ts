import { getNodeGraphData } from 'src/components/network-graph/helpers';
import i18n from 'src/i18n';
import { Node, NodeId } from 'src/models/node';
import { Relation, RelationId } from 'src/models/relation';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { useSettingsStore } from 'src/stores/settings';
import { nodesApi } from 'src/utils/api/nodes';
import { relationsApi } from 'src/utils/api/relations';

export const expandNodeAction = (nodeId: NodeId) => {
	const node = useItemsStore.getState().getStoreNode(nodeId);

	if (!node) {
		useNotificationsStore.getState().addNotification({
			title: i18n.t('notifications_warning_missing_node_locally', { id: nodeId }),
			type: 'warning'
		});

		useContextMenuStore.getState().close();

		return;
	}

	nodesApi.postNodeConnections({ nodeId: nodeId }).then(async (response) => {
		const sigma = useGraphStore.getState().sigma;
		const nodeDisplayData = sigma.getNodeDisplayData(nodeId);

		if (!nodeDisplayData) {
			return;
		}

		const nodes: Array<Node> = [];
		const relations: Array<Relation> = [];
		const relationsIdCache: Array<RelationId> = [];
		let biggestNodeSize = -Infinity;

		// filter out already existing nodes (this needs to be discussed, because although we haven't
		// received any new nodes, there are sometimes new relations)
		const filteredNeighbors = response.data.relations.filter((connection) => {
			const storeNode = useItemsStore.getState().getStoreNode(connection.neighbor.id);

			if (!storeNode) {
				nodes.push(connection.neighbor);
				relations.push(connection.relation);
				relationsIdCache.push(connection.relation.id);

				const nodeGraphData = getNodeGraphData(connection.neighbor);

				// find the biggest node among new nodes
				if (nodeGraphData.size > biggestNodeSize) {
					biggestNodeSize = nodeGraphData.size;
				}
			} else if (sigma.getGraph().hasNode(storeNode.id)) {
				// show hidden connected nodes
				if (sigma.getNodeDisplayData(storeNode.id)?.hidden) {
					sigma.getGraph().setNodeAttribute(storeNode.id, 'hidden', false);
				}
			}

			if (sigma.getGraph().hasEdge(connection.relation.id)) {
				// show hidden node relations
				if (sigma.getEdgeDisplayData(connection.relation.id)?.hidden) {
					sigma.getGraph().setEdgeAttribute(connection.relation.id, 'hidden', false);
				}
			}

			return !storeNode;
		});

		if (nodes.length === 0) {
			useNotificationsStore.getState().addNotification({
				title: i18n.t('notifications_info_node_connections_no_new_nodes'),
				type: 'informational'
			});

			useContextMenuStore.getState().close();

			return;
		}

		if (useSettingsStore.getState().isAutoconnectEnabled) {
			const autoconnectRelationsResponse = await relationsApi.postRelationsByNodeIds({
				additionalNodeIds: nodes.map((node) => node.id)
			});

			autoconnectRelationsResponse.data.forEach((relation) => {
				if (!relationsIdCache.includes(relation.id)) {
					relations.push(relation);
				}
			});
		}

		const distanceBetweenCentralPointAndNodes =
			biggestNodeSize + getNodeGraphData(node).size + 50;

		// convert (framed) graph to viewport
		const centralPoint = sigma.framedGraphToViewport({
			x: nodeDisplayData.x,
			y: nodeDisplayData.y
		});

		const circleLayoutPositions = generateCircleLayout(
			centralPoint,
			nodes.length,
			// scale the distance, so it is proportional to the zoom value
			sigma.scaleSize(distanceBetweenCentralPointAndNodes)
		);

		nodes.forEach((node, index) => {
			const newNodePosition = circleLayoutPositions[index];

			if (newNodePosition) {
				// TODO check if node's visual changes have effect of parallax
				node.style.x = newNodePosition.x.toString();
				node.style.y = newNodePosition.y.toString();

				useGraphStore.getState().addNode(node);
				useItemsStore.getState().setNode(node, true);
			} else {
				console.warn(
					`Context menu expand-node action: no circular layout position found for node ID ${node.id}.`
				);
			}
		});

		useGraphStore.getState().addRelations(relations);
		useItemsStore.getState().setRelations(relations, true);
		useItemsStore.getState().refreshNodesAndRelations();

		if (relations.length) {
			useGraphStore.getState().indexParallelRelations();
			useGraphStore.getState().adaptRelationsTypeAndCurvature();
		}

		if (filteredNeighbors.length !== 0) {
			useContextMenuStore.getState().addExpandedNode(nodeId, filteredNeighbors);
		}

		useContextMenuStore.getState().close();
	});
};

function generateCircleLayout(
	center: { x: number; y: number },
	numberOfNodes: number,
	distanceFromCenter: number
) {
	const positions: Array<{ x: number; y: number }> = [];

	// calculate the radius based on the size of the nodes and how much space we want between them
	const angleStep = (2 * Math.PI) / numberOfNodes;

	for (let i = 0, l = numberOfNodes; i < l; i++) {
		const angle = i * angleStep;

		// calculate the position of the node along the circle
		positions.push(
			useGraphStore.getState().sigma.viewportToGraph({
				x: center.x + distanceFromCenter * Math.cos(angle),
				y: center.y + distanceFromCenter * Math.sin(angle)
			})
		);
	}

	return positions;
}
