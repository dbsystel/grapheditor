import { DBButton } from '@db-ux/react-core-components';
import { useRef } from 'react';
import { ContextMenuSubMenu } from 'src/components/context-menu/sub-menu/ContextMenuSubMenu';
import { ContextMenuTopBlock } from 'src/components/context-menu/sub-menu/top-block/ContextMenuTopBlock';
import { NodeLabelsItemFinder } from 'src/components/node-labels-item-finder/NodeLabelsItemFinder';
import i18n from 'src/i18n';
import { Node, NodeLabelId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useItemsStore } from 'src/stores/items';
import { nodesApi } from 'src/utils/api/nodes';

export const AddLabelsAction = ({ goBack }: { goBack: () => void }) => {
	const labelIdsRef = useRef<Array<NodeLabelId>>([]);

	const onChange = (item: Node, isItemSelected: boolean, selectedItems: Array<Node>) => {
		labelIdsRef.current = selectedItems.map((selectedItem) => selectedItem.id);
	};

	const onApplyClick = async () => {
		useContextMenuStore.getState().setIsActionLoading(true);

		const patchNodes = useItemsStore
			.getState()
			.getStoreNodes(useContextMenuStore.getState().nodeIds)
			.map((node) => {
				const labels = [...node.labels, ...labelIdsRef.current];

				return {
					id: node.id,
					labels: [...new Set(labels)]
				};
			});

		await nodesApi.patchNodesAndUpdateApplication(patchNodes);

		useContextMenuStore.getState().close();
	};

	const itemsFinderLabel = i18n.t('context_menu_add_labels_action_item_finder_label');
	const applyButtonText = i18n.t('context_menu_add_labels_action_apply_button');

	return (
		<ContextMenuSubMenu className="context-menu__add-labels-action">
			<ContextMenuTopBlock closeSubMenuFunction={goBack} />
			<NodeLabelsItemFinder
				mode="default"
				isSelectAllDisabled={true}
				onChange={onChange}
				label={itemsFinderLabel}
				variant="above"
			/>
			<DBButton variant="brand" onClick={onApplyClick}>
				{applyButtonText}
			</DBButton>
		</ContextMenuSubMenu>
	);
};
