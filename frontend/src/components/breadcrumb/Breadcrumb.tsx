import './Breadcrumb.scss';
import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { MouseEvent, useCallback } from 'react';
import { useItemOverviewPopoverStore } from 'src/stores/item-overview-popover';
import { idFormatter } from 'src/utils/id-formatter';
import { BreadcrumbProps } from './Breadcrumb.interfaces';

const breadcrumbDelimiter = (
	<span data-icon="chevron_right" className="breadcrumb__delimiter"></span>
);

export const Breadcrumb = ({
	breadcrumb,
	shouldRenderDelimiter,
	isActive,
	id,
	className,
	testId
}: BreadcrumbProps) => {
	const rootElementClassName = clsx(
		'breadcrumb',
		{
			'breadcrumb--active': isActive
		},
		className
	);

	const onRefChange = useCallback((element: HTMLSpanElement | null) => {
		if (element) {
			useItemOverviewPopoverStore.getState().registerTriggerElement({
				triggerElement: element,
				item: breadcrumb.item,
				popoverPlacement: 'left-start'
			});
		}
	}, []);

	const localOnClick = (event: MouseEvent<HTMLSpanElement>) => {
		if (breadcrumb.onClick) {
			breadcrumb.onClick(event);
		}
	};

	return (
		<>
			<DBButton
				variant="ghost"
				size="small"
				id={id}
				className={rootElementClassName}
				data-testid={testId}
				onClick={localOnClick}
				ref={onRefChange}
			>
				{idFormatter.parseIdToName(breadcrumb.item.title)}
			</DBButton>
			{shouldRenderDelimiter && breadcrumbDelimiter}
		</>
	);
};
