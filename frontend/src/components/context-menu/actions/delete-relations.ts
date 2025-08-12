import { RelationId } from 'src/models/relation';
import { useContextMenuStore } from 'src/stores/context-menu';
import { relationsApi } from 'src/utils/api/relations';

export const deleteRelationsAction = (relationIds: Array<RelationId>) => {
	relationsApi.deleteRelationsAndUpdateApplication(relationIds, {
		onSuccess: () => {
			useContextMenuStore.getState().close();
		}
	});
};
