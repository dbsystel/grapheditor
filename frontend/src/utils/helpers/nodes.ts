import { ConnectionObject } from 'src/components/connections/Connections.interfaces';
import i18n from 'src/i18n';
import { ItemPropertyType } from 'src/models/item';
import {
	MetaNode,
	Node,
	NodeConnection,
	NonPseudoNode,
	PatchNode,
	PseudoNode
} from 'src/models/node';
import { NodeId } from 'src/models/node';
import { Relation, RelationId } from 'src/models/relation';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { GraphEditorTypeSimplified } from 'src/utils/constants';
import { deleteNodes } from 'src/utils/fetch/deleteNodes';
import { patchNodes } from 'src/utils/fetch/patchNodes';
import { isObject } from 'src/utils/helpers/general';
import { idFormatter } from 'src/utils/id-formatter';

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

export const isArrayOfNodes = (data: unknown): data is Array<Node> => {
	if (Array.isArray(data) && data.every((element) => isNode(element))) {
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

export const getNodeByIdFromArrayOfNodes = (nodes: Array<Node>, id: NodeId) => {
	return nodes.find((node) => node.id === id);
};

export const getNodesByIdFromArrayOfNodes = (nodes: Array<Node>, ids: Array<NodeId>) => {
	return nodes.filter((node) => ids.includes(node.id));
};

export const isNodePerspective = (node: Node) => {
	return node.labels.includes(
		`${GraphEditorTypeSimplified.META_LABEL}${idFormatter.separator}Perspective`
	);
};

export const getNodeMetaPropertyType = (node: Node): ItemPropertyType | undefined => {
	return node.properties[
		idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_PROPERTY, 'type', 'tech')
	]?.type;
};

export const getNodeSemanticIdOrId = (node: Node) => {
	return node.semanticId || node.id;
};

export const getNodeDbOrId = (node: Node) => {
	return node.dbId || node.id;
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
	const title = data?.title || idFormatter.parseIdToName(id);

	return {
		id: id,
		dbId: id,
		semanticId: data?.semanticId,
		_grapheditor_type: 'node',
		description: data?.description || 'Long description',
		// backend also sends English longDescription only
		longDescription: data?.longDescription || 'Description',
		labels: data?.labels || [],
		properties: data?.properties || {},
		title: title,
		style: data?.style || {}
	};
};

export const processNodeConnections = (node: Node, connections: Array<NodeConnection>) => {
	const entries: Array<{ relation: Relation; metarelation: Node }> = [];
	const connectionsArray: Array<ConnectionObject> = [];
	const nodeId = getNodeDbOrId(node);

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
			entries.push({
				relation: connection.relation,
				metarelation: connection.metarelation
			});
			processedRelationIds.push(connection.relation.id);
		}
	});

	entries.forEach((entry) => {
		const relation = entry.relation;

		if (relation.source_id === nodeId) {
			const targetNode = nodeMap.get(relation.target_id);
			if (targetNode) {
				const connection: ConnectionObject = {
					target: targetNode,
					relation: relation,
					metarelation: entry.metarelation
				};
				connectionsArray.push(connection);
			}
		} else if (relation.target_id === nodeId) {
			const sourceNode = nodeMap.get(relation.source_id);
			if (sourceNode) {
				const connection: ConnectionObject = {
					source: sourceNode,
					relation: relation,
					metarelation: entry.metarelation
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
	const nodeId = getNodeDbOrId(node);

	newConnections.forEach((connection) => {
		if (connection.relation) {
			if (connection.relation.source_id === nodeId) {
				newRelationsOutgoing.push(connection);
			} else if (connection.relation.target_id === nodeId) {
				newRelationsIncoming.push(connection);
			}
		}
	});

	connections.forEach((connection) => {
		if (connection.relation) {
			if (connection.relation.source_id === nodeId) {
				relationsOutgoing.push(connection);
			} else if (connection.relation.target_id === nodeId) {
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

export async function deleteNodesAndUpdateApplication(nodeIds: Array<NodeId>) {
	const notificationsStore = useNotificationsStore.getState();
	const itemsStore = useItemsStore.getState();

	const addNotification = notificationsStore.addNotification;

	const isOnlyOneNodeToDelete = nodeIds.length === 1;
	const successTitle = isOnlyOneNodeToDelete
		? 'notifications_success_node_delete'
		: 'notifications_success_nodes_delete_title';

	// on server we only need to remove nodes, their relations will be implicitly removed
	const nodesDeletionResponse = await deleteNodes({ nodeIds: nodeIds });
	const isDeletionSuccessful = nodesDeletionResponse.data.num_deleted === nodeIds.length;

	itemsStore.removeNodes(nodeIds);

	if (nodesDeletionResponse.data.num_deleted === 0) {
		addNotification({
			title: i18n.t('notifications_info_nodes_delete_no_nodes_deleted'),
			type: 'informational'
		});
	} else if (isDeletionSuccessful) {
		addNotification({
			title: i18n.t(successTitle),
			type: 'successful'
		});
	} else {
		addNotification({
			title: i18n.t('notifications_warning_nodes_delete_title'),
			description: i18n.t('notifications_warning_nodes_delete_description'),
			type: 'warning'
		});
	}

	return nodesDeletionResponse.data;
}

export async function patchNodesAndUpdateApplication(nodes: Array<PatchNode>) {
	const notificationsStore = useNotificationsStore.getState();
	const itemsStore = useItemsStore.getState();

	const addNotification = notificationsStore.addNotification;

	const nodesPatchResponse = await patchNodes(nodes);
	const serverNodes = Object.values(nodesPatchResponse.data.nodes);
	const isPatchSuccessful = Object.keys(nodesPatchResponse.data.nodes).length === nodes.length;
	const successTitle =
		nodes.length === 1
			? 'notifications_success_node_update'
			: 'notifications_success_nodes_update';

	// the items store must contain only nodes which are to be displayed in the graph/tables
	itemsStore.setNodes(serverNodes);

	if (isPatchSuccessful) {
		addNotification({
			title: i18n.t(successTitle),
			type: 'successful'
		});
	} else {
		addNotification({
			title: i18n.t('notifications_warning_nodes_update_title'),
			description: i18n.t('notifications_warning_nodes_update_description'),
			type: 'warning'
		});
	}

	return nodesPatchResponse.data.nodes;
}

export const getDirectionIcon = (direction: string, isSelfLoop: boolean) => {
	if (isSelfLoop) {
		return 'undo';
	}

	if (direction === 'outgoing') {
		return 'arrow_right';
	}

	return 'arrow_left';
};
