import './Content.scss';
import clsx from 'clsx';
import { MainVisual } from 'src/components/main-visual/MainVisual';
import { ParallaxBreadcrumbs } from 'src/components/parallax-breadcrumbs/ParallaxBreadcrumbs';
import { ContentProps } from './Content.interfaces';

export const Content = ({ id, className, testId }: ContentProps) => {
	const rootElementClassName = clsx('content', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<ParallaxBreadcrumbs />
			<MainVisual />
		</div>
	);
};
