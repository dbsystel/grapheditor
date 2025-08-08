import './Breadcrumbs.scss';
import clsx from 'clsx';
import { Fragment, MouseEvent, useEffect, useState } from 'react';
import { Breadcrumb, BreadcrumbsProps } from './Breadcrumbs.interfaces';

const breadcrumbDelimiter = (
	<span data-icon="chevron_right" className="breadcrumbs__delimiter"></span>
);

export const Breadcrumbs = ({
	breadcrumbs,
	activeBreadcrumbIndex,
	id,
	className,
	testId
}: BreadcrumbsProps) => {
	const rootElementClassName = clsx('breadcrumbs', className);
	const [localActiveBreadcrumbIndex, setLocalActiveBreadcrumbIndex] = useState(
		activeBreadcrumbIndex || 0
	);

	useEffect(() => {
		if (activeBreadcrumbIndex !== undefined) {
			setLocalActiveBreadcrumbIndex(activeBreadcrumbIndex);
		}
	}, [activeBreadcrumbIndex]);

	const getBreadcrumbComponent = (breadcrumb: Breadcrumb, index: number) => {
		const breadcrumbProps = {
			className: 'breadcrumbs__item',
			title: breadcrumb.title,
			onClick: (event: MouseEvent<HTMLSpanElement>) => {
				setLocalActiveBreadcrumbIndex(index);

				if (breadcrumb.onClick) {
					breadcrumb.onClick(event);
				}
			}
		};

		const renderDelimiter = index < breadcrumbs.length - 1;

		if (localActiveBreadcrumbIndex === index) {
			breadcrumbProps.className += ' breadcrumbs__item--active';
		}

		return (
			<>
				<span {...breadcrumbProps}>{breadcrumb.text}</span>
				{renderDelimiter && breadcrumbDelimiter}
			</>
		);
	};

	if (breadcrumbs.length === 0) {
		return null;
	}

	return (
		<nav id={id} className={rootElementClassName} data-testid={testId} aria-label="breadcrumb">
			{breadcrumbs.map((item, index) => {
				const component = getBreadcrumbComponent(item, index);

				return <Fragment key={index}>{component}</Fragment>;
			})}
		</nav>
	);
};
