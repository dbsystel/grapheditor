import './NetworkGraphCoordinatesScale.scss';
import { DBButton, DBInput, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { scaleNodeCoordinates } from 'src/components/network-graph/helpers';
import { useGraphStore } from 'src/stores/graph';
import { GRAPH_DEFAULT_NODE_AXIS_FACTOR } from 'src/utils/constants';
import { clone } from 'src/utils/helpers/general';
import { NetworkGraphCoordinatesScaleProps } from './NetworkGraphCoordinatesScale.interfaces';

export const NetworkGraphCoordinatesScale = ({
	id,
	className,
	testId
}: NetworkGraphCoordinatesScaleProps) => {
	const { t } = useTranslation();
	const setNodeAxisFactor = useGraphStore((store) => store.setNodeAxisFactor);
	const nodeAxisFactor = useGraphStore((store) => store.nodeAxisFactor);
	const rootElementClassName = clsx('network-graph__coordinates-scale', className);

	const setCoordinatesScaleState = (type: 'x' | 'y', value: number) => {
		const nodeAxisFactorClone = clone(nodeAxisFactor);
		nodeAxisFactorClone[type] = value;

		setNodeAxisFactor(nodeAxisFactorClone);
		scaleNodeCoordinates(nodeAxisFactorClone);
	};

	const onChangeX = (event: ChangeEvent<HTMLInputElement>) => {
		setCoordinatesScaleState('x', event.target.valueAsNumber);
	};

	const onChangeY = (event: ChangeEvent<HTMLInputElement>) => {
		setCoordinatesScaleState('y', event.target.valueAsNumber);
	};

	const resetScales = () => {
		const defaultNodeAxisFactor = { ...GRAPH_DEFAULT_NODE_AXIS_FACTOR };

		setNodeAxisFactor(defaultNodeAxisFactor);
		scaleNodeCoordinates(defaultNodeAxisFactor);
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<DBInput
				label={t('network_graph_coordinates_scale_scale_x')}
				type="number"
				step={0.1}
				value={nodeAxisFactor.x}
				onChange={onChangeX}
			/>
			<DBInput
				label={t('network_graph_coordinates_scale_scale_y')}
				type="number"
				step={0.1}
				value={nodeAxisFactor.y}
				onChange={onChangeY}
			/>
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
	);
};
