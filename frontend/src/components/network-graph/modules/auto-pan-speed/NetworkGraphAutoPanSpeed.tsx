import './NetworkGraphAutoPanSpeed.scss';
import { DBButton, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGraphStore } from 'src/stores/graph';
import { useSearchStore } from 'src/stores/search';
import { GlobalComponentProps } from 'src/types/components';
import { GRAPH_AUTO_PAN_MAX_SPEED_PX, GRAPH_PRESENTATION_GRAPH } from 'src/utils/constants';
import { useDebounce } from 'src/utils/hooks/useDebounce';

/**
 * Lets the user configure how fast the camera auto-pans while dragging
 * node(s) close to the edge of the graph container (see
 * "NetworkGraphDragNodes"). Mirrors "NetworkGraphZoomFactor"'s structure/
 * behavior - a debounced range input backed by the graph store, plus a reset
 * button that restores the default speed.
 */
export const NetworkGraphAutoPanSpeed = ({ id, className, testId }: GlobalComponentProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('network-graph__auto-pan-speed', className);
	const { autoPanSpeed, setAutoPanSpeed, autoPanSpeedMin, autoPanSpeedMax, autoPanSpeedStep } =
		useGraphStore((store) => store);
	const searchStore = useSearchStore((store) => store);
	const isGraphPresentation = searchStore.presentation == GRAPH_PRESENTATION_GRAPH;
	const [localAutoPanSpeed, setLocalAutoPanSpeed] = useState(autoPanSpeed);
	const delayedCallback = useDebounce(200);
	// speed is a whole px/frame value, no decimals needed
	const formattedLocalAutoPanSpeed = localAutoPanSpeed.toFixed(0);

	useEffect(() => {
		setLocalAutoPanSpeed(autoPanSpeed);
	}, [autoPanSpeed]);

	const onRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
		const newAutoPanSpeed = parseFloat(event.target.value);

		setLocalAutoPanSpeed(newAutoPanSpeed);

		// persist with graph store once the user is done changing the value (reduce the number of graph store and graph updates)
		delayedCallback(() => {
			setAutoPanSpeed(newAutoPanSpeed);
		});
	};

	const onReset = () => {
		setAutoPanSpeed(GRAPH_AUTO_PAN_MAX_SPEED_PX);
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<div className="network-graph__auto-pan-speed-title">
				<label htmlFor="network-graph-auto-pan-speed">{t('graph_auto_pan_speed')}</label>
			</div>
			<div className="network-graph__auto-pan-speed-content">
				<input
					id="network-graph-auto-pan-speed"
					type="range"
					min={autoPanSpeedMin}
					max={autoPanSpeedMax}
					value={localAutoPanSpeed}
					step={autoPanSpeedStep}
					onChange={onRangeChange}
					disabled={!isGraphPresentation}
				/>
				{isGraphPresentation && (
					<output htmlFor="network-graph-auto-pan-speed">
						{formattedLocalAutoPanSpeed}
					</output>
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
						{t('graph_auto_pan_speed_reset')}
					</DBTooltip>
				</DBButton>
			</div>
		</div>
	);
};
