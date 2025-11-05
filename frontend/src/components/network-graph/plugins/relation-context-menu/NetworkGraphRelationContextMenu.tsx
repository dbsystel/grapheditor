import { useEffect } from 'react';
import { SigmaEdgeEventPayload } from 'sigma/types';
import { getMouseViewportCoordinates } from 'src/components/network-graph/helpers';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';

export const NetworkGraphRelationContextMenu = () => {
	const getStoreRelation = useItemsStore((store) => store.getStoreRelation);

	useEffect(() => {
		const onRelationContextMenu = (event: SigmaEdgeEventPayload) => {
			const storeRelation = getStoreRelation(event.edge);
			const highlightedNodeIds = useGraphStore.getState().highlightedNodeIds;
			const { x, y } = getMouseViewportCoordinates(event);

			if (highlightedNodeIds.size > 1) {
				const highlightedRelationIds = useGraphStore.getState().highlightedRelationIds;

				useContextMenuStore.getState().open({
					type: 'graph-multiselect',
					event: event,
					nodeIds: highlightedNodeIds.values().toArray(),
					relationIds: highlightedRelationIds.values().toArray(),
					x: x,
					y: y
				});
			} else if (storeRelation) {
				useContextMenuStore.getState().open({
					type: 'graph-relation',
					event: event,
					relationIds: [storeRelation.id],
					x: x,
					y: y
				});
			} else {
				console.warn(
					`No relation with ID ${event.edge} could be found. Aborting context menu.`
				);
			}
		};

		StateManager.getInstance().on('RELATION_CONTEXT_MENU', onRelationContextMenu);

		return () => {
			useContextMenuStore.getState().reset();
			StateManager.getInstance().off('RELATION_CONTEXT_MENU', onRelationContextMenu);
		};
	}, []);

	return null;
};
