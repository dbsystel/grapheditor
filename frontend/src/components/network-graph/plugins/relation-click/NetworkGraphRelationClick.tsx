import { useEffect } from 'react';
import { SigmaEdgeEventPayload } from 'sigma/types';
import { StateManager } from 'src/components/network-graph/state-manager';
import { RelationId } from 'src/models/relation';
import { useDrawerStore } from 'src/stores/drawer';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';

export const NetworkGraphRelationClick = () => {
	const { setEntry } = useDrawerStore((store) => store);
	const { highlightRelation, unHighlightRelations, unHighlightNodes } = useGraphStore(
		(store) => store
	);
	const getRelation = useItemsStore((store) => store.getRelation);

	useEffect(() => {
		// open relation details on relation click
		StateManager.getInstance().on('RELATION_CLICK', enableRelationDetailsOnClick);

		return () => {
			StateManager.getInstance().off('RELATION_CLICK', enableRelationDetailsOnClick);
		};
	}, []);

	function enableRelationDetailsOnClick(eventPayload: SigmaEdgeEventPayload) {
		const relation = getRelation(eventPayload.edge);

		if (relation) {
			highlightRelation(eventPayload.edge);

			setEntry({
				itemId: relation.id,
				itemType: 'relation',
				onMount: () => localHighlightRelation(eventPayload.edge),
				onDrawerClose: unHighlightRelations
			});
		}
	}

	const localHighlightRelation = (relationId: RelationId) => {
		unHighlightRelations();
		unHighlightNodes();
		highlightRelation(relationId);
	};

	return null;
};
