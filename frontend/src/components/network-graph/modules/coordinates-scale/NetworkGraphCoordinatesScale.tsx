import './NetworkGraphCoordinatesScale.scss';
import { DBButton, DBInput, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { scaleNodeCoordinates } from 'src/components/network-graph/helpers';
import { useGraphStore } from 'src/stores/graph';
import { NetworkGraphCoordinatesScaleProps } from './NetworkGraphCoordinatesScale.interfaces';

export const NetworkGraphCoordinatesScale = ({
	id,
	className,
	testId
}: NetworkGraphCoordinatesScaleProps) => {
	const { t } = useTranslation();
	const isSigmaReady = useGraphStore((store) => store.isSigmaReady);
	const [coordinatesScale, setCoordinatesScale] = useState({ x: 1, y: 1 });
	const rootElementClassName = clsx('network-graph__coordinates-scale', className);

	useEffect(() => {
		// reset on sigma unload/reset
		if (!isSigmaReady) {
			setCoordinatesScale({ x: 1, y: 1 });
		}
	}, [isSigmaReady]);

	const setCoordinatesScaleState = (type: 'x' | 'y' | 'reset', value?: number) => {
		setCoordinatesScale((prevState) => {
			const newState = { ...prevState };

			if (type === 'reset') {
				newState.x = 1;
				newState.y = 1;
			} else {
				newState[type] = value || 1;
			}

			scaleNodeCoordinates(newState.x, newState.y);

			return newState;
		});
	};

	const onChangeX = (event: ChangeEvent<HTMLInputElement>) => {
		setCoordinatesScaleState('x', event.target.valueAsNumber);
	};

	const onChangeY = (event: ChangeEvent<HTMLInputElement>) => {
		setCoordinatesScaleState('y', event.target.valueAsNumber);
	};

	const resetScales = () => {
		setCoordinatesScaleState('reset', 1);
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<div className="network-graph__coordinates-scale-block">
				<DBInput
					label={t('network_graph_coordinates_scale_scale_x')}
					type="number"
					step={0.1}
					value={coordinatesScale.x}
					onChange={onChangeX}
				/>
				<DBInput
					label={t('network_graph_coordinates_scale_scale_y')}
					type="number"
					step={0.1}
					value={coordinatesScale.y}
					onChange={onChangeY}
				/>
			</div>
			<div className="network-graph__coordinates-scale-block">
				<DBButton
					type="button"
					size="medium"
					noText
					iconLeading="undo"
					variant="ghost"
					onClick={resetScales}
				>
					<DBTooltip className="db-tooltip-fix db-tooltip-fix--left">
						{t('network_graph_coordinates_scale_scale_reset')}
					</DBTooltip>
				</DBButton>
			</div>
		</div>
	);
};
