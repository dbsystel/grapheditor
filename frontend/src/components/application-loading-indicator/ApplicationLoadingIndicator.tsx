import './ApplicationLoadingIndicator.scss';
import { DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoadingRequestsStore } from 'src/stores/loading-requests';
import { ApplicationLoadingIndicatorProps } from './ApplicationLoadingIndicator.interfaces';

/**
 * A small circular dot that indicates whether the application has ongoing API HTTP requests.
 * It subscribes to a global loading store and toggles between an inactive and an active (brand-colored) state while any
 * loading actions are in progress. A tooltip provides additional context on hover.
 */
export const ApplicationLoadingIndicator = ({
	id,
	className,
	testId
}: ApplicationLoadingIndicatorProps) => {
	const { t } = useTranslation();
	const loadingIndicator = useLoadingRequestsStore((store) => {
		const loadingActions = store.loadingRequests;

		if (loadingActions.length === 0) {
			return 0;
		}

		// show minimum progress
		return Math.min(...loadingActions.map((loadingAction) => loadingAction.progress));
	});
	const loadingIndicatorStateRef = useRef<HTMLDivElement | null>(null);
	const rootElementClassName = clsx('application-loading-indicator', className, {
		'application-loading-indicator--loading': loadingIndicator > 0 && loadingIndicator < 100
	});

	useEffect(() => {
		// all requests completed, clear requests
		if (loadingIndicator === 100) {
			useLoadingRequestsStore.getState().clearFinishedLoadingRequests();
		}
	}, [loadingIndicator]);

	const tooltipText = t('application_loading_indicator_tooltip');

	return (
		<div
			className={rootElementClassName}
			id={id}
			data-testid={testId}
			ref={loadingIndicatorStateRef}
		>
			<DBTooltip text={tooltipText} />
		</div>
	);
};
