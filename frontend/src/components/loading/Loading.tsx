import './Loading.scss';
import clsx from 'clsx';
import { Children, cloneElement, isValidElement } from 'react';
import { LoadingProps } from './Loading.interfaces';

const loadingStyleClassName = 'loading--is-loading';

/**
 * Simple "loading" component.
 * It can either render a regular "Loading..." text, or it can visually modify
 * its children (children won't be unmounted!).
 */
export const Loading = ({
	isLoading,
	wrapChildren,
	renderChildrenWhileLoading,
	children,
	id,
	className,
	testId
}: LoadingProps) => {
	const rootElementClassName = clsx(
		'loading',
		{
			[loadingStyleClassName]: isLoading
		},
		className
	);

	const loadingChildren = isLoading
		? renderChildrenWhileLoading
			? children
			: 'Loading...'
		: children;

	if (!wrapChildren) {
		return Children.map(loadingChildren, (child) => {
			if (isValidElement<{ className?: string }>(child)) {
				let childClassName = child.props.className || '';

				if (childClassName && isLoading) {
					childClassName += ' ';
				}

				return cloneElement(child, {
					className: childClassName + (isLoading ? loadingStyleClassName : '')
				});
			}

			return child;
		});
	}

	return (
		<div
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			aria-busy={isLoading}
			aria-live={isLoading ? 'polite' : undefined}
			role={isLoading ? 'status' : undefined}
		>
			{loadingChildren}
		</div>
	);
};
