import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NodeLabelsItemFinder } from 'src/components/node-labels-item-finder/NodeLabelsItemFinder';
import { Node } from 'src/models/node';
import { useGraphStore } from 'src/stores/graph';
import { postNodesLabelsDefault } from 'src/utils/fetch/postNodesLabelsDefault';
import { useGetNodesDefaultLabelsNodes } from 'src/utils/hooks/useGetNodesDefaultLabelsNodes';

export const NetworkGraphNodeLabelsDefault = () => {
	const { defaultNodeLabels, setDefaultNodeLabels } = useGraphStore((store) => store);
	const { t } = useTranslation();
	const initialDefaultLabelsFetched = useRef(false);
	const { reFetch, isLoading } = useGetNodesDefaultLabelsNodes({
		executeImmediately: true,
		onSuccess: (data) => {
			setDefaultNodeLabels(data.data.nodes);
			initialDefaultLabelsFetched.current = true;
		}
	});

	const onDefaultNodeLabelsChange = (
		item: Node,
		isItemSelected: boolean,
		selectedItems: Array<Node>
	) => {
		postNodesLabelsDefault({ labelIds: selectedItems.map((label) => label.id) }).then(() => {
			reFetch();
		});
	};

	const defaultNodeLabelsLabel = t('graph_default_node_labels_label');
	const defaultNodeLabelsPlaceholder = t('graph_default_node_labels_placeholder');
	const defaultSelectedOptions = defaultNodeLabels || undefined;

	if (isLoading && !initialDefaultLabelsFetched.current) {
		return;
	}

	return (
		<NodeLabelsItemFinder
			value={defaultSelectedOptions}
			label={defaultNodeLabelsLabel}
			placeholder={defaultNodeLabelsPlaceholder}
			mode="default"
			variant="above"
			onChange={onDefaultNodeLabelsChange}
		/>
	);
};
