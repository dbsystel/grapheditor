import './ParallaxBreadcrumbs.scss';
import { Fragment } from 'react';
import { ParallaxBreadcrumb } from 'src/components/parallax-breadcrumb/ParallaxBreadcrumb';
import { useParallaxStore } from 'src/stores/parallax';

export const ParallaxBreadcrumbs = () => {
	const history = useParallaxStore((store) => store.history);
	const initialQuery = useParallaxStore((store) => store.initialQuery);

	if (!initialQuery.nodeIds.length) {
		return;
	}

	return (
		<div className="parallax-breadcrumbs">
			<ParallaxBreadcrumb index={-1} />
			{history.map((historyEntry, index) => {
				return (
					<Fragment key={'parallax-breadcrumb-' + index}>
						<ParallaxBreadcrumb index={index} historyEntry={historyEntry} />
					</Fragment>
				);
			})}
		</div>
	);
};
