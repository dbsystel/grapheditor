import { RelationId } from 'src/models/relation';
import { useContextMenuStore } from 'src/stores/context-menu';
import { api } from 'src/utils/api/api';

export const deleteRelationsAction = (relationIds: Array<RelationId>) => {
	api.relations.actions.deleteRelationsAndUpdateApplication(relationIds).then(() => {
		useContextMenuStore.getState().close();
	});
};
