import { DBButton, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { fitGraphToViewport } from 'src/components/network-graph/helpers';
import { useGraphStore } from 'src/stores/graph';
import { isNode } from 'src/utils/helpers/nodes';
import { ItemCenterButtonProps } from './ItemCenterButton.interfaces';

export const ItemCenterButton = ({
	item,
	isDisabled,
	id,
	className,
	testId
}: ItemCenterButtonProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('item-center-button', className);

	const onCenterInGraphClick = () => {
		const nodeIds = isNode(item) ? [item.id] : [item.source_id, item.target_id];

		fitGraphToViewport(useGraphStore.getState().sigma, nodeIds);
	};

	return (
		<span id={id} className={rootElementClassName} data-testid={testId}>
			<DBButton
				disabled={isDisabled}
				icon="start"
				variant="ghost"
				noText
				size="small"
				onClick={onCenterInGraphClick}
				type="button"
			/>
			<DBTooltip className="db-tooltip-fix db-tooltip-fix--left-start">
				{isDisabled
					? t('single_item_center_in_graph_disabled')
					: t('single_item_center_in_graph')}
			</DBTooltip>
		</span>
	);
};
