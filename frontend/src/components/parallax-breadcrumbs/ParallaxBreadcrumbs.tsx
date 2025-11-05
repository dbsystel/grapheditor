import './ParallaxBreadcrumbs.scss';
import clsx from 'clsx';
import { Fragment } from 'react';
import { Loading } from 'src/components/loading/Loading';
import { ParallaxBreadcrumb } from 'src/components/parallax-breadcrumb/ParallaxBreadcrumb';
import { useParallaxStore } from 'src/stores/parallax';
import { ParallaxBreadcrumbsProps } from './ParallaxBreadcrumbs.interfaces';

export const ParallaxBreadcrumbs = ({ id, className, testId }: ParallaxBreadcrumbsProps) => {
	const history = useParallaxStore((store) => store.history);
	const initialQuery = useParallaxStore((store) => store.initialQuery);
	const isLoading = useParallaxStore((store) => store.isLoading);
	const rootElementClassName = clsx('parallax-breadcrumbs', className);

	if (!initialQuery.nodeIds.length) {
		return;
	}

	return (
		<Loading isLoading={isLoading} renderChildrenWhileLoading={true}>
			<div id={id} className={rootElementClassName} data-testid={testId}>
				<ParallaxBreadcrumb index={-1} />
				{history.map((historyEntry, index) => {
					return (
						<Fragment key={'parallax-breadcrumb-' + index}>
							<ParallaxBreadcrumb index={index} historyEntry={historyEntry} />
						</Fragment>
					);
				})}
			</div>
		</Loading>
	);
};
