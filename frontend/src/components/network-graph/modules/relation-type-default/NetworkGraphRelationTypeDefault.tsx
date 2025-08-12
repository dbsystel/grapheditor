import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { RelationTypeItemFinder } from 'src/components/relation-type-item-finder/RelationTypeItemFinder';
import { Node } from 'src/models/node';
import { useGraphStore } from 'src/stores/graph';
import { useNotificationsStore } from 'src/stores/notifications';
import { relationsApi } from 'src/utils/api/relations';
import { useGetRelationsDefaultTypeNode } from 'src/utils/hooks/useGetRelationsDefaultTypeNode';

export const NetworkGraphRelationTypeDefault = () => {
	const { defaultRelationType, setDefaultRelationType } = useGraphStore((store) => store);
	const { t } = useTranslation();
	const { addNotification } = useNotificationsStore((store) => store);
	const { isLoading } = useGetRelationsDefaultTypeNode({
		executeImmediately: true,
		onSuccess: (data) => {
			setDefaultRelationType(data.data.node);
			initialDefaultTypeFetched.current = true;
		},
		onError: () => {
			addNotification({
				title: t('notifications_failure_default_relation_type_fetch'),
				type: 'critical'
			});
		}
	});
	const initialDefaultTypeFetched = useRef(false);

	const onDefaultRelationTypeChange = (item: Node) => {
		relationsApi.postRelationDefaultTypeNode({ typeId: item.id }).then(() => {
			setDefaultRelationType(item);
		});
	};

	const onEnterKey = (searchTerm: string, matchingTypes: Array<Node>) => {
		if (matchingTypes.length) {
			setDefaultRelationType(matchingTypes[0]);
		}
	};

	const defaultRelationTypeLabel = t('graph_default_relation_type_label');
	const defaultRelationTypePlaceholder = t('graph_default_relation_type_placeholder');
	const defaultSelectedOptions = defaultRelationType ? [defaultRelationType] : undefined;
	const defaultInputValue = defaultRelationType ? defaultRelationType.title : undefined;

	if (isLoading && !initialDefaultTypeFetched.current) {
		return;
	}

	return (
		<RelationTypeItemFinder
			defaultInputValue={defaultInputValue}
			value={defaultSelectedOptions}
			label={defaultRelationTypeLabel}
			placeholder={defaultRelationTypePlaceholder}
			variant="above"
			onChange={onDefaultRelationTypeChange}
			onEnterKey={onEnterKey}
		/>
	);
};
