import i18n from 'src/i18n';
import { RelationId } from 'src/models/relation';
import { useConfirmationModalStore } from 'src/stores/confirmation-modal';
import { useContextMenuStore } from 'src/stores/context-menu';
import { api } from 'src/utils/api/api';

export const deleteRelationsAction = (relationIds: Array<RelationId>) => {
	useContextMenuStore.getState().close();

	const isPlural = relationIds.length > 1;

	const description = isPlural
		? i18n.t('confirm_delete_relations', { ids: relationIds.join(', ') })
		: i18n.t('confirm_delete_relation', { id: relationIds[0] });

	const title = isPlural
		? i18n.t('confirm_delete_relations_title')
		: i18n.t('confirm_delete_relation_title');

	const confirmLabel = isPlural
		? i18n.t('confirm_delete_relations_button')
		: i18n.t('confirm_delete_relation_button');

	useConfirmationModalStore.getState().open({
		title,
		description,
		onCancelClick: () => useConfirmationModalStore.getState().close(),
		onConfirmClick: () => {
			api.relations.actions.deleteRelationsAndUpdateApplication(relationIds).then(() => {
				useConfirmationModalStore.getState().close();
			});
		},
		confirmLabel
	});
};
