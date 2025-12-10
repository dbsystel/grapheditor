import './NetworkGraphZoomFactor.scss';
import { DBButton, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGraphStore } from 'src/stores/graph';
import { useSearchStore } from 'src/stores/search';
import { GlobalComponentProps } from 'src/types/components';
import { GRAPH_DEFAULT_ZOOMING_RATIO, GRAPH_PRESENTATION_GRAPH } from 'src/utils/constants';
import { useDebounce } from 'src/utils/hooks/useDebounce';

export const NetworkGraphZoomFactor = ({ id, className, testId }: GlobalComponentProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('network-graph__zoom-factor', className);
	const {
		zoomFactor,
		setZoomFactor,
		zoomFactorMin,
		zoomFactorMax,
		zoomFactorStep: zoomFactorIncrementBy
	} = useGraphStore((store) => store);
	const searchStore = useSearchStore((store) => store);
	const isGraphPresentation = searchStore.presentation == GRAPH_PRESENTATION_GRAPH;
	const [localZoomFactor, setLocalZoomFactor] = useState(zoomFactor);
	const delayedCallback = useDebounce(200);
	// always show with one decimal point to skip number repositioning
	const formattedLocalZoomFactor = localZoomFactor.toFixed(1);

	useEffect(() => {
		setLocalZoomFactor(zoomFactor);
	}, [zoomFactor]);

	const onRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
		const newZoomFactor = parseFloat(event.target.value);

		setLocalZoomFactor(newZoomFactor);

		delayedCallback(() => {
			setZoomFactor(newZoomFactor);
		});
	};

	const onReset = () => {
		setZoomFactor(GRAPH_DEFAULT_ZOOMING_RATIO);
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<div className="network-graph__zoom-factor-title">
				<label htmlFor="network-graph-zoom-factor">{t('graph_zoom_speed')}</label>
			</div>
			<div className="network-graph__zoom-factor-content">
				<input
					id="network-graph-zoom-factor"
					type="range"
					min={zoomFactorMin}
					max={zoomFactorMax}
					value={localZoomFactor}
					step={zoomFactorIncrementBy}
					onChange={onRangeChange}
					disabled={!isGraphPresentation}
				/>
				{isGraphPresentation && (
					<output htmlFor="network-graph-zoom-factor">{formattedLocalZoomFactor}</output>
				)}

				<DBButton
					type="button"
					size="medium"
					noText
					iconLeading="undo"
					variant="ghost"
					onClick={onReset}
					disabled={!isGraphPresentation}
				>
					<DBTooltip className="db-tooltip-fix db-tooltip-fix--left">
						{t('graph_zoom_speed_reset')}
					</DBTooltip>
				</DBButton>
			</div>
		</div>
	);
};
