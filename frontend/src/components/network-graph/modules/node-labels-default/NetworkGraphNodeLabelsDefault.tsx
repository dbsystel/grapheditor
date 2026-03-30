import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NodeLabelsItemFinder } from 'src/components/node-labels-item-finder/NodeLabelsItemFinder';
import { Node } from 'src/models/node';
import { useGraphStore } from 'src/stores/graph';
import { api } from 'src/utils/api/api';
import { getNodeSemanticIdOrId } from 'src/utils/helpers/nodes';
import { useGetNodesDefaultLabelsNodes } from 'src/utils/hooks/useGetNodesDefaultLabelsNodes';

export const NetworkGraphNodeLabelsDefault = () => {
	const { defaultNodeLabels, setDefaultNodeLabels } = useGraphStore((store) => store);
	const { t } = useTranslation();
	const initialDefaultLabelsFetched = useRef(false);
	const { isLoading } = useGetNodesDefaultLabelsNodes({
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
		setDefaultNodeLabels(selectedItems);
		api.nodes.fetch.postNodesLabelsDefault({
			labelIds: selectedItems.map((label) => getNodeSemanticIdOrId(label))
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
			isSelectAllDisabled={true}
		/>
	);
};
