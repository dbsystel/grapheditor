import './ParallaxBreadcrumb.scss';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { Tooltip } from 'src/components/tooltip/Tooltip';
import { useParallaxStore } from 'src/stores/parallax';
import { useSearchStore } from 'src/stores/search';
import { parallaxApi } from 'src/utils/api/parallax';
import { buildSimpleSearchResult } from 'src/utils/helpers/search';
import { ParallaxBreadcrumbProps } from './ParallaxBreadcrumb.interfaces';

export const ParallaxBreadcrumb = ({
	index,
	historyEntry,
	id,
	className,
	testId
}: ParallaxBreadcrumbProps) => {
	const [ref, setRef] = useState<HTMLSpanElement | null>(null);
	const currentParallaxHistoryIndex = useParallaxStore((store) => store.currentHistoryIndex);
	const setParallaxCurrentHistoryIndex = useParallaxStore(
		(store) => store.setCurrentHistoryIndex
	);
	const setParallaxIsLoading = useParallaxStore((store) => store.setIsLoading);
	const setParallaxData = useParallaxStore((store) => store.setParallaxData);
	const initialParallaxQuery = useParallaxStore((store) => store.initialQuery);
	const setResult = useSearchStore((store) => store.setResult);
	const onRefChange = useCallback((element: HTMLSpanElement | null) => {
		setRef(element);
	}, []);
	const rootElementClassName = clsx('parallax-breadcrumb', className);

	const onBreadcrumbClick = () => {
		const parallaxStore = useParallaxStore.getState();

		setParallaxCurrentHistoryIndex(index);
		setParallaxIsLoading(true);

		parallaxApi
			.postParallax({
				nodeIds: initialParallaxQuery.nodeIds,
				filters: initialParallaxQuery.filters,
				steps: parallaxStore.history.slice(0, index + 1)
			})
			.then((response) => {
				setResult(buildSimpleSearchResult(Object.values(response.data.nodes)), 'parallax');
				setParallaxData(response.data);
			})
			.finally(() => {
				setParallaxIsLoading(false);
			});
	};

	const separator = index > -1 ? '\xa0-\xa0' : '';
	const text = `( ${index === -1 ? 'i' : index + 1} )`;

	return (
		<div
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			data-inactive={index <= currentParallaxHistoryIndex ? undefined : true}
			ref={onRefChange}
		>
			<div>
				{separator && <span className="parallax-breadcrumb__separator">{separator}</span>}
				<span className="parallax-breadcrumb__title" onClick={onBreadcrumbClick}>
					{text}
				</span>

				<Tooltip tooltipTargetRef={ref} placement="bottom">
					<div className="parallax-breadcrumb__tooltip-content">
						<pre>
							{JSON.stringify(
								historyEntry ? historyEntry : initialParallaxQuery,
								null,
								2
							)}
						</pre>
					</div>
				</Tooltip>
			</div>
		</div>
	);
};
