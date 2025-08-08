import { RelationId } from 'src/models/relation';
import { useContextMenuStore } from 'src/stores/context-menu';
import { deleteRelationsAndUpdateApplication } from 'src/utils/helpers/relations';

export const deleteRelationsAction = (relationIds: Array<RelationId>) => {
	deleteRelationsAndUpdateApplication(relationIds, () => {
		useContextMenuStore.getState().close();
	});
};
