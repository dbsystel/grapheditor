import { AxiosResponse } from 'axios';
import i18n from 'src/i18n';
import { StyleProperties } from 'src/models/general';
import { Relation, RelationId } from 'src/models/relation';
import { useDrawerStore } from 'src/stores/drawer';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { GraphEditorTypeSimplified } from 'src/utils/constants';
import { deleteRelation, DeleteRelationResponse } from 'src/utils/fetch/deleteRelation';
import { deleteRelations } from 'src/utils/fetch/deleteRelations';
import { isObject } from 'src/utils/helpers/general';
import { idFormatter } from 'src/utils/idFormatter';

export const isRelation = (data: unknown): data is Relation => {
	if (isObject(data) && '_grapheditor_type' in data && data._grapheditor_type === 'relation') {
		return true;
	} else {
		return false;
	}
};

export const generateRelation = (
	id: string,
	sourceId: string,
	targetId: string,
	style?: StyleProperties
): Relation => {
	return {
		id: id,
		dbId: id,
		_grapheditor_type: 'relation',
		description: 'Long description',
		// backend also sends English longDescription only
		longDescription: 'Description',
		properties: {},
		title: idFormatter.parseId(id),
		style: style || {},
		source_id: sourceId,
		target_id: targetId,
		type: idFormatter.formatObjectId(GraphEditorTypeSimplified.META_RELATION, 'connects', 'unknown')
	};
};

export const deleteRelationAndUpdateApplication = (
	relationId: RelationId,
	onDelete?: (response: AxiosResponse<DeleteRelationResponse>) => void
) => {
	const notificationsStore = useNotificationsStore.getState();
	const graphStore = useGraphStore.getState();
	const drawerStore = useDrawerStore.getState();
	const itemsStore = useItemsStore.getState();

	const addNotification = notificationsStore.addNotification;
	const removeGraphRelation = graphStore.removeRelation;
	const removeEntryByItemId = drawerStore.removeEntryByItemId;
	const removeItemsStoreRelation = itemsStore.removeRelation;

	if (window.confirm(i18n.t('confirm_delete_relation', { id: relationId }))) {
		deleteRelation({ relationId: relationId }).then((response) => {
			const isDeletionSuccessful = response.data.num_deleted > 0;

			if (isDeletionSuccessful) {
				removeEntryByItemId(relationId);
				removeGraphRelation(relationId);
				removeItemsStoreRelation(relationId);
			}

			if (onDelete) {
				onDelete(response);
			}

			if (isDeletionSuccessful) {
				addNotification({
					title: i18n.t('notifications_success_relation_delete'),
					type: 'successful'
				});
			} else {
				addNotification({
					title: i18n.t('notifications_failure_relation_delete'),
					type: 'critical'
				});
			}
		});
	}
};

export const deleteRelationsAndUpdateApplication = (
	relationIds: Array<RelationId>,
	onDelete?: (response: AxiosResponse<DeleteRelationResponse>) => void
) => {
	const notificationsStore = useNotificationsStore.getState();
	const graphStore = useGraphStore.getState();
	const drawerStore = useDrawerStore.getState();
	const itemsStore = useItemsStore.getState();

	const addNotification = notificationsStore.addNotification;
	const removeGraphRelation = graphStore.removeRelation;
	const removeEntryByItemId = drawerStore.removeEntryByItemId;
	const removeItemsStoreRelation = itemsStore.removeRelation;
	const refreshRelations = itemsStore.refreshRelations;

	if (window.confirm(i18n.t('confirm_delete_relations'))) {
		deleteRelations({ relationIds: relationIds }).then((response) => {
			const isDeletionSuccessful = response.data.num_deleted > 0;

			relationIds.forEach((relationId) => {
				removeEntryByItemId(relationId);
				removeGraphRelation(relationId);
				removeItemsStoreRelation(relationId, true);
			});

			if (onDelete) {
				onDelete(response);
			}

			refreshRelations();

			addNotification({
				title: i18n.t(
					isDeletionSuccessful
						? 'notifications_success_relations_delete'
						: 'notifications_warning_relations_delete_title'
				),
				type: isDeletionSuccessful ? 'successful' : 'warning',
				description: isDeletionSuccessful
					? i18n.t('notifications_warning_relations_delete_description')
					: response.data.message
			});
		});
	}
};
