import { ConnectionObject } from 'src/components/connections/Connections.interfaces';
import i18n from 'src/i18n';
import { ItemPropertyType } from 'src/models/item';
import { MetaNode, Node, NodeConnection, NodeId, NonPseudoNode, PseudoNode } from 'src/models/node';
import { Perspective } from 'src/models/perspective';
import { Relation, RelationId } from 'src/models/relation';
import { useDrawerStore } from 'src/stores/drawer';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { useSearchStore } from 'src/stores/search';
import { GRAPH_LAYOUT_PERSPECTIVE, GraphEditorTypeSimplified } from 'src/utils/constants';
import { deleteNodes, DeleteNodesResponse } from 'src/utils/fetch/deleteNodes';
import { isObject } from 'src/utils/helpers/general';
import { buildSearchResult } from 'src/utils/helpers/search';
import { idFormatter } from 'src/utils/idFormatter';

export const isNode = (data: unknown): data is Node => {
	if (isObject(data) && '_grapheditor_type' in data && data._grapheditor_type === 'node') {
		return true;
	} else {
		return false;
	}
};

export const isPseudoNode = (data: unknown): data is PseudoNode => {
	return isNode(data) && !('dbId' in data) && !('semanticId' in data);
};

export const isNonPseudoNode = (data: unknown): data is NonPseudoNode => {
	return isNode(data) && 'dbId' in data;
};

export const isMetaNode = (data: unknown): data is MetaNode => {
	if (isNode(data) && 'semanticId' in data && data.semanticId !== null) {
		return true;
	}

	return false;
};

/**
 * Helper function to check if two nodes have at least one type of ID that are equal.
 */
export const areNodesSameById = (nodeA: Node, nodeB: Node) => {
	if (nodeA.semanticId === nodeB.semanticId) {
		return true;
	} else if (nodeA.dbId === nodeB.dbId) {
		return true;
	} else if (nodeA.id === nodeB.id) {
		return true;
	}

	return false;
};

export const isNodePerspective = (node: Node) => {
	return node.labels.includes(
		`${GraphEditorTypeSimplified.META_LABEL}${idFormatter.separator}Perspective`
	);
};

export const getNodeMetaPropertyType = (node: Node): ItemPropertyType | undefined => {
	return node.properties[
		idFormatter.formatObjectId(GraphEditorTypeSimplified.META_PROPERTY, 'type', 'tech')
	]?.type;
};

export const nodeContainsSearchTerm = (
	node: Node,
	searchTerm: string,
	doExactTitleSearch?: boolean
): boolean => {
	const searchTermLowerCase = searchTerm.toLocaleLowerCase();

	if (doExactTitleSearch) {
		return node.title.trim() === searchTerm.trim();
	}

	return (
		node.title.toLocaleLowerCase().includes(searchTermLowerCase) ||
		node.description.toLocaleLowerCase().includes(searchTermLowerCase) ||
		node.longDescription.toLocaleLowerCase().includes(searchTermLowerCase) ||
		node.labels.some((label) => {
			return label.toLocaleLowerCase().includes(searchTermLowerCase);
		})
	);
};

export const labelsContainMetaLabels = (labels: Array<string>) => {
	return !!labels.find(
		(label) =>
			label.startsWith(GraphEditorTypeSimplified.META_LABEL) ||
			label.startsWith(GraphEditorTypeSimplified.META_RELATION) ||
			label.startsWith(GraphEditorTypeSimplified.META_PROPERTY)
	);
};

export const generateNode = (id: string, data?: Omit<Partial<Node>, 'id'>): Node => {
	return {
		id: id,
		dbId: id,
		// TODO use a correct value instead of empty string
		semanticId: labelsContainMetaLabels(data?.labels || []) ? '' : null,
		_grapheditor_type: 'node',
		description: data?.description || 'Long description',
		// backend also sends English longDescription only
		longDescription: data?.longDescription || 'Description',
		labels: data?.labels || [],
		properties: data?.properties || {},
		title: data?.title || idFormatter.parseId(id),
		style: data?.style || {}
	};
};

export const processPerspective = (perspective: Perspective) => {
	const nodes: Map<string, Node> = new Map(Object.entries(perspective.nodes));
	const relations: Map<string, Relation> = new Map();

	const { setResult, setAlgorithm, setIsResultProcessed } = useSearchStore.getState();
	const { setPerspectiveId, setPerspectiveName, unHighlightNodes, unHighlightRelations } =
		useGraphStore.getState();

	// map relations properly since GET /api/v1/perspectives currently
	// returns an object which keys are short ID form, and not the long one
	Object.values(perspective.relations).forEach((relation) => {
		relations.set(relation.id, relation);
	});

	unHighlightNodes();
	unHighlightRelations();
	setPerspectiveId(perspective.id);
	setPerspectiveName(perspective.name || '');
	setAlgorithm(GRAPH_LAYOUT_PERSPECTIVE);
	setIsResultProcessed(false);
	setResult(buildSearchResult(nodes, relations));
};

export const processNodeConnections = (node: Node, connections: Array<NodeConnection>) => {
	const relations: Array<Relation> = [];
	const connectionsArray: Array<ConnectionObject> = [];

	/*
		Note: Self referencing nodes will return 2 the same relations as neighbors
	*/
	const processedRelationIds: Array<RelationId> = [];
	const nodeMap = new Map<string, Node>();

	connections.forEach((connection) => {
		/*
		we save the nodes in a map to have easy access via the id of each node,
		so we can prevent further loops if id changes.
		*/
		nodeMap.set(connection.neighbor.id, connection.neighbor);

		if (!processedRelationIds.includes(connection.relation.id)) {
			relations.push(connection.relation);
			processedRelationIds.push(connection.relation.id);
		}
	});

	relations.forEach((relation) => {
		if (relation.source_id === node.id) {
			const targetNode = nodeMap.get(relation.target_id);
			if (targetNode) {
				const connection: ConnectionObject = {
					target: targetNode,
					relation: relation
				};
				connectionsArray.push(connection);
			}
		} else if (relation.target_id === node.id) {
			const sourceNode = nodeMap.get(relation.source_id);
			if (sourceNode) {
				const connection: ConnectionObject = {
					source: sourceNode,
					relation: relation
				};
				connectionsArray.push(connection);
			}
		}
	});

	return connectionsArray;
};

export const sortNodeConnections = (
	node: Node,
	newConnections: Array<ConnectionObject>,
	connections: Array<ConnectionObject>
) => {
	/*
		Note: If relation.source_id and relation.target_id are equal, we will by default assume outgoing relation direction.
	*/
	const newRelationsIncoming: Array<ConnectionObject> = [];
	const newRelationsOutgoing: Array<ConnectionObject> = [];
	const relationsIncoming: Array<ConnectionObject> = [];
	const relationsOutgoing: Array<ConnectionObject> = [];

	newConnections.forEach((connection) => {
		if (connection.relation) {
			if (connection.relation.source_id === node.id) {
				newRelationsOutgoing.push(connection);
			} else if (connection.relation.target_id === node.id) {
				newRelationsIncoming.push(connection);
			}
		}
	});

	connections.forEach((connection) => {
		if (connection.relation) {
			if (connection.relation.source_id === node.id) {
				relationsOutgoing.push(connection);
			} else if (connection.relation.target_id === node.id) {
				relationsIncoming.push(connection);
			}
		}
	});

	return {
		newRelationsIncoming: newRelationsIncoming,
		newRelationsOutgoing: newRelationsOutgoing,
		relationsIncoming: relationsIncoming,
		relationsOutgoing: relationsOutgoing
	};
};

export const deleteNodesAndUpdateApplication = async (
	nodeIds: Array<NodeId>,
	onDelete?: (deleteNodesResponse: DeleteNodesResponse) => void
) => {
	const notificationsStore = useNotificationsStore.getState();
	const graphStore = useGraphStore.getState();
	const drawerStore = useDrawerStore.getState();
	const itemsStore = useItemsStore.getState();

	const addNotification = notificationsStore.addNotification;
	const removeGraphNode = graphStore.removeNode;
	const removeGraphRelation = graphStore.removeRelation;
	const removeEntryByItemId = drawerStore.removeEntryByItemId;
	const removeItemsStoreNode = itemsStore.removeNode;
	const removeItemsStoreRelation = itemsStore.removeRelation;
	const refreshNodesAndRelations = itemsStore.refreshNodesAndRelations;

	const graph = graphStore.sigma.getGraph();
	const isOnlyOneNodeToDelete = nodeIds.length === 1;
	const confirmMessage = isOnlyOneNodeToDelete ? 'confirm_delete_node' : 'confirm_delete_nodes';
	const successMessage = isOnlyOneNodeToDelete
		? 'notifications_success_node_delete'
		: 'notifications_success_nodes_delete_title';

	if (window.confirm(i18n.t(confirmMessage))) {
		// on server we only need to remove nodes, their relations will be implicitly removed
		const nodesDeletionResponse = await deleteNodes({ nodeIds: nodeIds });
		const isDeletionSuccessful = nodesDeletionResponse.data.num_deleted === nodeIds.length;

		nodeIds.forEach((nodeId) => {
			graph.forEachEdge(nodeId, (relationId) => {
				removeEntryByItemId(relationId);
				removeItemsStoreRelation(relationId, true);
				removeGraphRelation(relationId);
			});

			removeEntryByItemId(nodeId);
			removeItemsStoreNode(nodeId, true);
			removeGraphNode(nodeId);
		});

		// re-render components subscribed to the items store nodes and relations changes
		refreshNodesAndRelations();

		if (onDelete) {
			onDelete(nodesDeletionResponse.data);
		}

		// TODO check if data.num_deleted === 0
		if (isDeletionSuccessful) {
			addNotification({
				title: i18n.t(successMessage),
				type: 'successful'
			});
		} else {
			addNotification({
				title: i18n.t('notifications_warning_nodes_delete'),
				type: 'warning'
			});
		}
	}
};
