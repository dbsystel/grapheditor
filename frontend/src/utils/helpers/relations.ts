import i18n from 'src/i18n';
import { StyleProperties } from 'src/models/general';
import { PatchRelation, Relation } from 'src/models/relation';
import { RelationId } from 'src/models/relation';
import { useDrawerStore } from 'src/stores/drawer';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { GraphEditorTypeSimplified } from 'src/utils/constants';
import { deleteRelations } from 'src/utils/fetch/deleteRelations';
import { patchRelations } from 'src/utils/fetch/patchRelations';
import { isObject } from 'src/utils/helpers/general';
import { idFormatter } from 'src/utils/idFormatter';

export const isRelation = (data: unknown): data is Relation => {
	if (isObject(data) && '_grapheditor_type' in data && data._grapheditor_type === 'relation') {
		return true;
	} else {
		return false;
	}
};

export const isArrayOfRelations = (data: unknown): data is Array<Relation> => {
	if (Array.isArray(data) && data.every((element) => isRelation(element))) {
		return true;
	}

	return false;
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
		title: idFormatter.parseIdToName(id),
		style: style || {},
		source_id: sourceId,
		target_id: targetId,
		type: idFormatter.formatSemanticId(
			GraphEditorTypeSimplified.META_RELATION,
			'connects',
			'unknown'
		)
	};
};

export async function deleteRelationsAndUpdateApplication(relationIds: Array<RelationId>) {
	const notificationsStore = useNotificationsStore.getState();
	const itemsStore = useItemsStore.getState();

	const addNotification = notificationsStore.addNotification;

	const isOnlyOneRelationToDelete = relationIds.length === 1;
	const confirmMessage = isOnlyOneRelationToDelete
		? 'confirm_delete_relation'
		: 'confirm_delete_relations';
	const successTitle = isOnlyOneRelationToDelete
		? 'notifications_success_relation_delete'
		: 'notifications_success_relations_delete';

	if (window.confirm(i18n.t(confirmMessage, { id: relationIds.at(0) }))) {
		const relationsDeletionResponse = await deleteRelations({ relationIds: relationIds });
		const isDeletionSuccessful = relationsDeletionResponse.data.num_deleted > 0;

		itemsStore.removeRelations(relationIds);

		if (isDeletionSuccessful) {
			addNotification({
				title: i18n.t(successTitle),
				type: 'successful'
			});
		} else {
			addNotification({
				title: i18n.t('notifications_warning_relations_delete_title'),
				type: 'warning',
				description: i18n.t('notifications_warning_relations_delete_description')
			});
		}

		return relationsDeletionResponse.data;
	} else {
		throw new Error('User confirmation failed.');
	}
}

export async function patchRelationsAndUpdateApplication(relations: Array<PatchRelation>) {
	const notificationsStore = useNotificationsStore.getState();
	const itemsStore = useItemsStore.getState();
	const graphStore = useGraphStore.getState();
	const drawerStore = useDrawerStore.getState();

	const addNotification = notificationsStore.addNotification;

	const localRelationsMap = relations.reduce<Record<RelationId, PatchRelation>>(
		(previousValue, currentValue) => {
			previousValue[currentValue.id] = currentValue;

			return previousValue;
		},
		{}
	);
	const relationsPatchResponse = await patchRelations(relations);
	const responseRelationsMap = relationsPatchResponse.data.relations;
	const isPatchSuccessful = Object.keys(responseRelationsMap).length === relations.length;
	const successTitle =
		relations.length === 1
			? 'notifications_success_relation_update'
			: 'notifications_success_relations_update';

	itemsStore.setRelations(Object.values(responseRelationsMap));

	for (const oldRelationKey in responseRelationsMap) {
		const serverRelation = responseRelationsMap[oldRelationKey];
		const localRelation = localRelationsMap[oldRelationKey];

		// check if, due to relation update, a new relation was created (e.g. relation type change)
		if (serverRelation.id !== oldRelationKey) {
			const relationHighlighted = graphStore.isRelationHighlighted(localRelation.id);
			const drawerItem = drawerStore.getActiveEntry();

			// if necessary, update drawer data which will re-render this component
			if (drawerItem && drawerItem.item.id === oldRelationKey) {
				// TODO improve to replace a specific entry only, currently this will replace all entries
				drawerStore.setEntry({
					...drawerItem,
					item: serverRelation
				});
			}

			itemsStore.removeRelation(localRelation.id, true);
			graphStore.addRelation(serverRelation);

			// highlight new relation if previous was highlighted in graph
			if (relationHighlighted) {
				useGraphStore.getState().sigma.once('afterRender', () => {
					graphStore.highlightRelation(serverRelation.id);
				});
			}
		}
	}

	graphStore.indexParallelRelations();
	graphStore.adaptRelationsTypeAndCurvature();
	itemsStore.refreshRelations();

	if (isPatchSuccessful) {
		addNotification({
			title: i18n.t(successTitle),
			type: 'successful'
		});
	} else {
		addNotification({
			title: i18n.t('notifications_warning_relations_update_title'),
			description: i18n.t('notifications_warning_relations_update_description'),
			type: 'warning'
		});
	}

	return relationsPatchResponse.data.relations;
}
