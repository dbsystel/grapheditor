import { DBButton, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { centerAndHighlightItemInGraph } from 'src/components/network-graph/helpers';
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
		centerAndHighlightItemInGraph(item);
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
