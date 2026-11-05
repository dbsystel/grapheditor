import { DBInfotext } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation();
	const rootElementClassName = clsx('item-property-widget-not-supported', className);
	const isValid = defaultValue !== undefined && defaultValue !== null;

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{isValid ? (
				JSON.stringify(defaultValue)
			) : (
				<DBInfotext
					semantic="warning"
					text={t('item_property_widget_not_supported_invalid_message')}
				/>
			)}
		</div>
	);
};
