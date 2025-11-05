import './ParallaxBreadcrumb.scss';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { Tooltip } from 'src/components/tooltip/Tooltip';
import { useParallaxStore } from 'src/stores/parallax';
import { parallaxApi } from 'src/utils/api/parallax';
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
	const initialParallaxQuery = useParallaxStore((store) => store.initialQuery);
	const onRefChange = useCallback((element: HTMLSpanElement | null) => {
		setRef(element);
	}, []);
	const rootElementClassName = clsx('parallax-breadcrumb', className);

	const onBreadcrumbClick = () => {
		useParallaxStore.getState().setApiTriggerType('breadcrumbs');
		parallaxApi.triggerBreadcrumbs(index);
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
