import './Breadcrumbs.scss';
import clsx from 'clsx';
import { Breadcrumb } from 'src/components/breadcrumb/Breadcrumb';
import { BreadcrumbsProps } from './Breadcrumbs.interfaces';

export const Breadcrumbs = ({
	breadcrumbs,
	activeBreadcrumbIndex,
	id,
	className,
	testId
}: BreadcrumbsProps) => {
	const rootElementClassName = clsx('breadcrumbs', className);

	if (breadcrumbs.length === 0) {
		return null;
	}

	return (
		<nav id={id} className={rootElementClassName} data-testid={testId} aria-label="breadcrumb">
			{breadcrumbs.map((breadcrumb, index) => {
				return (
					<Breadcrumb
						key={index}
						isActive={activeBreadcrumbIndex === index}
						shouldRenderDelimiter={index < breadcrumbs.length - 1}
						breadcrumb={breadcrumb}
					/>
				);
			})}
		</nav>
	);
};
