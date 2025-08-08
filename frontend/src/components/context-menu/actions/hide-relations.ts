import { RelationId } from 'src/models/relation';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';

export const hideRelationsAction = (relationIds: Array<RelationId>) => {
	relationIds.forEach((relationId) => {
		useGraphStore.getState().sigma.getGraph().setEdgeAttribute(relationId, 'hidden', true);
	});

	useContextMenuStore.getState().close();
};
