import { EdgeEntry, NodeEntry } from 'graphology-types';
import {
	GraphEditorSigmaNodeAttributes,
	GraphEditorSigmaRelationAttributes
} from 'src/components/network-graph/NetworkGraph.interfaces';
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { objectHasOwnProperty } from 'src/utils/helpers/general';
import { create } from 'zustand';

type ClipboardStore = {
	clipboard: ClipboardStoreClipboard;
	writeToClipboard: (data: Partial<ClipboardStoreClipboard>) => void;
	getAvailableNodes: () => Array<Node>;
	getAvailableRelations: () => Array<Relation>;
	isClipboardEmpty: () => boolean;
	reset: () => void;
};

type ClipboardStoreGraphNode = NodeEntry<GraphEditorSigmaNodeAttributes>;
type ClipboardStoreGraphRelation = EdgeEntry<
	GraphEditorSigmaNodeAttributes,
	GraphEditorSigmaRelationAttributes
>;

type InitialState = Omit<
	ClipboardStore,
	| 'writeToClipboard'
	| 'getAvailableNodes'
	| 'getAvailableRelations'
	| 'isClipboardEmpty'
	| 'reset'
>;
type ClipboardStoreClipboard = {
	nodes: Array<Node>;
	graphNodes: Array<ClipboardStoreGraphNode>;
	relations: Array<Relation>;
	graphRelations: Array<ClipboardStoreGraphRelation>;
};

const getInitialState: () => InitialState = () => {
	return {
		clipboard: {
			nodes: [],
			graphNodes: [],
			relations: [],
			graphRelations: []
		}
	};
};

/**
 * A simple clipboard store.
 * It should provide better control of what did the user copy and make dealing
 * with paste much more predictable since we know the structure of our clipboard store.
 * Also, it allows user to use its default clipboard browser functionality and
 * our in parallel.
 */
export const useClipboardStore = create<ClipboardStore>()((set, get) => {
	return {
		...getInitialState(),
		writeToClipboard: (data) => {
			// remove undefined values due to the TS "exactOptionalPropertyTypes" option currently
			// being set to "false" (optional TS properties get "| undefined" by TS)
			for (const [key, value] of Object.entries(data)) {
				if (objectHasOwnProperty(data, key) && value === undefined) {
					delete data[key as keyof typeof data];
				}
			}

			const newData = Object.assign<
				ClipboardStoreClipboard,
				Partial<ClipboardStoreClipboard>
			>(
				{
					nodes: [],
					graphNodes: [],
					relations: [],
					graphRelations: []
				},
				data
			);

			set({
				clipboard: newData
			});
		},
		getAvailableNodes: () => {
			const nodes = get().clipboard.nodes;
			const graphNodes = get().clipboard.graphNodes;

			if (nodes.length) {
				return nodes;
			}

			return graphNodes.map((graphNode) => graphNode.attributes.data);
		},
		getAvailableRelations: () => {
			const relations = get().clipboard.relations;
			const graphRelations = get().clipboard.graphRelations;

			if (relations.length) {
				return relations;
			}

			return graphRelations.map((graphRelation) => graphRelation.attributes.data);
		},
		isClipboardEmpty: () => {
			const availableNodes = get().getAvailableNodes();
			const availableRelations = get().getAvailableRelations();
			const hasItems = Boolean(availableNodes.length || availableRelations.length);

			return !hasItems;
		},
		reset: () => {
			set(getInitialState());
		}
	};
});

(window as any).useClipboardStore = useClipboardStore;
