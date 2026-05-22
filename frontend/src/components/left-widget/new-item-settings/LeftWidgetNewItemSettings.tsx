import './LeftWidgetNewItemSettings.scss';
import clsx from 'clsx';
import { NetworkGraphNodeLabelsDefault } from 'src/components/network-graph/modules/node-labels-default/NetworkGraphNodeLabelsDefault';
import { NetworkGraphRelationTypeDefault } from 'src/components/network-graph/modules/relation-type-default/NetworkGraphRelationTypeDefault';
import { LeftWidgetNewItemSettingsProps } from './LeftWidgetNewItemSettings.interfaces';

export const LeftWidgetNewItemSettings = ({
	id,
	className,
	testId
}: LeftWidgetNewItemSettingsProps) => {
	const rootElementClassName = clsx('left-widget__new-item-settings', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<NetworkGraphNodeLabelsDefault />
			<NetworkGraphRelationTypeDefault />
		</div>
	);
};
