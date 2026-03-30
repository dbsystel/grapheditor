import clsx from 'clsx';
import { ItemPropertyWidgetNotSupportedProps } from './ItemPropertyWidgetNotSupported.interfaces';

/**
 * This component is used to display a widget for a not supported item property type.
 * Since we don't know what to render, we just display the JSON stringified value.
 * */
export const ItemPropertyWidgetNotSupported = ({
	defaultValue,
	id,
	className,
	testId
}: ItemPropertyWidgetNotSupportedProps) => {
	const rootElementClassName = clsx('item-property-widget-not-supported', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{JSON.stringify(defaultValue)}
		</div>
	);
};
