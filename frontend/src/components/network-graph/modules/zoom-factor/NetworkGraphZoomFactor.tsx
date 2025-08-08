import './NetworkGraphZoomFactor.scss';
import clsx from 'clsx';
import { ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGraphStore } from 'src/stores/graph';
import { GlobalComponentProps } from 'src/types/components';
import { GRAPH_DEFAULT_ZOOMING_RATIO } from 'src/utils/constants';
import { useDebounce } from 'src/utils/hooks/useDebounce';

export const NetworkGraphZoomFactor = ({ id, className, testId }: GlobalComponentProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('network-graph__zoom-factor', className);
	const { zoomFactor, setZoomFactor, zoomFactorMin, zoomFactorMax, zoomFactorIncrementBy } =
		useGraphStore((store) => store);
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
			<div className="network-graph__zoom-factor-top-block">
				<label htmlFor="network-graph-zoom-factor">{t('graph_zoom_speed')}</label>
				<button type="button" onClick={onReset}>
					Reset
				</button>
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
				/>
				<output htmlFor="network-graph-zoom-factor">{formattedLocalZoomFactor}</output>
			</div>
		</div>
	);
};
