import { NodeConnection, NodeId } from 'src/models/node';
import { RelationId } from 'src/models/relation';
import { create } from 'zustand';

type ExpandedNodeData = {
	neighbors: Array<NodeConnection>;
	expandedNodes: ExpandedNodes;
};

type NodeAndRelationIds = {
	nodeIds: Array<NodeId>;
	relationIds: Array<RelationId>;
};

export type ExpandedNodes = Map<NodeId, ExpandedNodeData>;

type ExpandNodeStore = {
	expandedNodes: ExpandedNodes;
	addExpandedNode: (nodeId: NodeId, neighbors: Array<NodeConnection>) => void;
	removeExpandedNode: (nodeId: NodeId) => void;
	updateExapndedNodeNeighbors: (nodeId: NodeId, neighbors: Array<NodeConnection>) => void;
	getExpandedNodeData: (nodeId: NodeId) => ExpandedNodeData | null;
	getExpandedNodeNodeAndRelationIds: (nodeId: NodeId) => NodeAndRelationIds;
	isNodeExpanded: (nodeId: NodeId) => boolean;
	reset: () => void;
};

type InitialState = Omit<
	ExpandNodeStore,
	| 'addExpandedNode'
	| 'removeExpandedNode'
	| 'updateExapndedNodeNeighbors'
	| 'getExpandedNodeData'
	| 'getExpandedNodeNodeAndRelationIds'
	| 'isNodeExpanded'
	| 'reset'
>;

const getInitialState: () => InitialState = () => {
	return {
		expandedNodes: new Map()
	};
};

/**
 * Exapnd store used for storing expanded nodes and their relations.
 */
export const useExpandNodeStore = create<ExpandNodeStore>((set, get) => ({
	...getInitialState(),
	addExpandedNode: (nodeId, neighbors) => {
		const expandedNodeData = get().getExpandedNodeData(nodeId);

		if (expandedNodeData) {
			neighbors.forEach((neighbor) => {
				expandedNodeData.expandedNodes.set(neighbor.neighbor.id, {
					neighbors: [],
					expandedNodes: new Map()
				});
			});
			expandedNodeData.neighbors = neighbors;
		} else {
			const expandedNodesMap: ExpandedNodes = new Map();

			neighbors.forEach((neighbor) => {
				expandedNodesMap.set(neighbor.neighbor.id, {
					neighbors: [],
					expandedNodes: new Map()
				});
			});

			get().expandedNodes.set(nodeId, {
				neighbors: neighbors,
				expandedNodes: expandedNodesMap
			});
		}
	},
	isNodeExpanded: (nodeId) => {
		const expandedNodeData = get().getExpandedNodeData(nodeId);

		if (!expandedNodeData) {
			return false;
		}

		return expandedNodeData.expandedNodes.size > 0;
	},
	getExpandedNodeData: (nodeId) => {
		let expandedNodeData: ExpandedNodeData | null = null;

		const searchForExpandedNodeData = (map: ExpandedNodes) => {
			const levelNodeExpanded = map.get(nodeId);

			if (levelNodeExpanded) {
				expandedNodeData = levelNodeExpanded;
				return;
			}

			for (const [key, value] of map) {
				const expandedNodes = value.expandedNodes.get(key);

				if (!expandedNodes) {
					searchForExpandedNodeData(value.expandedNodes);
				} else {
					expandedNodeData = expandedNodes;
					break;
				}
			}
		};

		searchForExpandedNodeData(get().expandedNodes);

		return expandedNodeData;
	},
	removeExpandedNode: (nodeId) => {
		const locateAndRemoveExpandedNode = (map: ExpandedNodes) => {
			const expandedNode = map.get(nodeId);

			if (expandedNode) {
				expandedNode.expandedNodes = new Map();
				expandedNode.neighbors = [];

				return;
			}

			for (const [, value] of map) {
				locateAndRemoveExpandedNode(value.expandedNodes);
			}
		};

		locateAndRemoveExpandedNode(get().expandedNodes);
	},
	getExpandedNodeNodeAndRelationIds: (nodeId) => {
		const nodeAndRelationIds: NodeAndRelationIds = {
			nodeIds: [],
			relationIds: []
		};

		const expandedNodeData = get().getExpandedNodeData(nodeId);

		if (expandedNodeData) {
			const getNeighbors = (data: ExpandedNodeData) => {
				if (data.expandedNodes.size) {
					data.neighbors.forEach((neighbor) => {
						nodeAndRelationIds.nodeIds.push(neighbor.neighbor.id);
						nodeAndRelationIds.relationIds.push(neighbor.relation.id);
					});

					data.expandedNodes.forEach((expandedNodeData) => {
						getNeighbors(expandedNodeData);
					});
				}
			};

			getNeighbors(expandedNodeData);

			nodeAndRelationIds.nodeIds = [...new Set(nodeAndRelationIds.nodeIds)];
			nodeAndRelationIds.relationIds = [...new Set(nodeAndRelationIds.relationIds)];
		}

		return nodeAndRelationIds;
	},
	updateExapndedNodeNeighbors: (nodeId, neighbors) => {
		const expandedNodeData = get().getExpandedNodeData(nodeId);

		if (expandedNodeData) {
			const neighborRelationIds = neighbors.map((neighbor) => neighbor.relation.id);
			const neighborsWithoutMatch = expandedNodeData.neighbors.filter((neighbor) => {
				return !neighborRelationIds.includes(neighbor.relation.id);
			});

			expandedNodeData.neighbors.push(...neighborsWithoutMatch, ...neighbors);
		}
	},
	reset: () => {
		set(getInitialState());
	}
}));

(window as any).useExpandNodeStore = useExpandNodeStore;
