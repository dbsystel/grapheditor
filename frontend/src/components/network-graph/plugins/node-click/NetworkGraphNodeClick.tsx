import { useEffect } from 'react';
import { SigmaNodeEventPayload } from 'sigma/types';
import { StateManager } from 'src/components/network-graph/state-manager';
import { NodeId } from 'src/models/node';
import { useDrawerStore } from 'src/stores/drawer';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';

export const NetworkGraphNodeClick = () => {
	const setEntry = useDrawerStore((state) => state.setEntry);
	const { unHighlightNodes, highlightNode, unHighlightRelations } = useGraphStore(
		(store) => store
	);
	const getNode = useItemsStore((store) => store.getNode);

	useEffect(() => {
		// open node details on node click
		StateManager.getInstance().on('NODE_CLICK', enableNodeDetailsOnClick);

		return () => {
			StateManager.getInstance().off('NODE_CLICK', enableNodeDetailsOnClick);
		};
	}, []);

	const enableNodeDetailsOnClick = (eventPayload: SigmaNodeEventPayload) => {
		const node = getNode(eventPayload.node);

		if (node) {
			setEntry({
				itemId: node.id,
				itemType: 'node',
				onMount: () => localHighlightNode(eventPayload.node),
				onDrawerClose: unHighlightNodes
			});
		}
	};

	const localHighlightNode = (nodeId: NodeId) => {
		unHighlightRelations();
		unHighlightNodes();
		highlightNode(nodeId);
	};

	return null;
};
