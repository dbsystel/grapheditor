import { useEffect } from 'react';
import { SigmaNodeEventPayload } from 'sigma/types';
import { getMouseViewportCoordinates } from 'src/components/network-graph/helpers';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';

export const NetworkGraphNodeContextMenu = () => {
	const getStoreNode = useItemsStore((store) => store.getStoreNode);

	useEffect(() => {
		const onNodeContextMenu = (event: SigmaNodeEventPayload) => {
			const node = getStoreNode(event.node);
			const highlightedNodeIds = useGraphStore.getState().highlightedNodeIds;
			const { x, y } = getMouseViewportCoordinates(event);

			if (highlightedNodeIds.size > 1 && node && highlightedNodeIds.has(node.id)) {
				const highlightedRelationIds = useGraphStore.getState().highlightedRelationIds;

				useContextMenuStore.getState().open({
					type: 'graph-multiselect',
					event: event,
					nodeIds: highlightedNodeIds.values().toArray(),
					relationIds: highlightedRelationIds.values().toArray(),
					x: x,
					y: y
				});
			} else if (node) {
				useContextMenuStore.getState().open({
					type: 'graph-node',
					event: event,
					nodeIds: [node.id],
					x: x,
					y: y
				});
			} else {
				console.warn(
					`No node with ID ${event.node} could be found. Aborting context menu.`
				);
			}
		};

		StateManager.getInstance().on('NODE_CONTEXT_MENU', onNodeContextMenu);

		return () => {
			useContextMenuStore.getState().reset();
			StateManager.getInstance().off('NODE_CONTEXT_MENU', onNodeContextMenu);
		};
	}, []);

	return null;
};
