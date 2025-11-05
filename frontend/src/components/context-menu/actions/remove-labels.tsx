import { DBButton, DBCustomSelect } from '@db-ux/react-core-components';
import { CustomSelectOptionType } from '@db-ux/react-core-components/dist/components/custom-select/model';
import { useEffect, useRef, useState } from 'react';
import { ContextMenuSubMenu } from 'src/components/context-menu/sub-menu/ContextMenuSubMenu';
import { ContextMenuTopBlock } from 'src/components/context-menu/sub-menu/top-block/ContextMenuTopBlock';
import i18n from 'src/i18n';
import { NodeLabelId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useItemsStore } from 'src/stores/items';
import { nodesApi } from 'src/utils/api/nodes';

export const RemoveLabelsAction = ({ goBack }: { goBack: () => void }) => {
	const [options, setOptions] = useState<Array<CustomSelectOptionType>>([]);
	const labelIdsRef = useRef<Array<NodeLabelId>>([]);

	useEffect(() => {
		const labels = useItemsStore
			.getState()
			.getStoreNodes(useContextMenuStore.getState().nodeIds)
			.reduce<Array<NodeLabelId>>((accumulator, currentValue) => {
				const labels = [...accumulator, ...currentValue.labels];

				return [...new Set(labels)];
			}, []);

		setOptions(
			labels.map((label) => {
				return {
					label: label,
					value: label
				};
			})
		);
	}, []);

	const onOptionSelected = (selectedLabels: Array<NodeLabelId>) => {
		labelIdsRef.current = selectedLabels;
	};

	const onApplyClick = async () => {
		useContextMenuStore.getState().setIsActionLoading(true);

		const patchNodes = useItemsStore
			.getState()
			.getStoreNodes(useContextMenuStore.getState().nodeIds)
			.map((node) => {
				return {
					id: node.id,
					labels: node.labels.filter((label) => {
						return !labelIdsRef.current.includes(label);
					})
				};
			});

		await nodesApi.patchNodesAndUpdateApplication(patchNodes);

		useContextMenuStore.getState().close();
	};

	const dropdownLabel = i18n.t('context_menu_remove_labels_action_labels_dropdown_label');
	const applyButtonText = i18n.t('context_menu_remove_labels_action_apply_button');
	const selectAllLabel = i18n.t('context_menu_remove_labels_action_select_all_label');

	return (
		<ContextMenuSubMenu className="context-menu__add-labels-action">
			<ContextMenuTopBlock closeSubMenuFunction={goBack} />
			<DBCustomSelect
				options={options}
				onOptionSelected={onOptionSelected}
				label={dropdownLabel}
				placeholder=""
				multiple={true}
				showSearch={true}
				dropdownWidth="full"
				selectAllLabel={selectAllLabel}
			/>
			<DBButton variant="brand" onClick={onApplyClick}>
				{applyButtonText}
			</DBButton>
		</ContextMenuSubMenu>
	);
};
