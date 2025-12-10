import './NetworkGraphFontSize.scss';
import { DBButton, DBInput, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useGraphStore } from 'src/stores/graph';
import { useSearchStore } from 'src/stores/search';
import { GlobalComponentProps } from 'src/types/components';
import {
	GRAPH_DEFAULT_FONT_SIZE_FACTOR_MAX,
	GRAPH_DEFAULT_FONT_SIZE_FACTOR_MIN,
	GRAPH_DEFAULT_FONT_SIZE_FACTOR_STEP,
	GRAPH_PRESENTATION_GRAPH
} from 'src/utils/constants';

export const NetworkGraphFontSize = ({ id, className, testId }: GlobalComponentProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('network-graph__font-size', className);
	const searchStore = useSearchStore((store) => store);
	const isGraphPresentation = searchStore.presentation == GRAPH_PRESENTATION_GRAPH;
	const { labelFontSizeFactor, setLabelFontSizeFactor, resetLabelFontSizeFactor } = useGraphStore(
		(store) => store
	);

	const onReset = () => {
		resetLabelFontSizeFactor();
	};

	const updateFontSize = (event: ChangeEvent<HTMLInputElement>) => {
		setLabelFontSizeFactor(parseInt(event.target.value) / 100);
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<div className="network-graph__font-size-title">
				<label htmlFor="network-graph-font-size">{t('graph_font_size_title')}</label>
			</div>
			<div className="network-graph__font-size-content">
				<DBInput
					id="network-graph-font-size"
					showLabel={false}
					type="number"
					step={Math.round(GRAPH_DEFAULT_FONT_SIZE_FACTOR_STEP * 100)}
					min={Math.round(GRAPH_DEFAULT_FONT_SIZE_FACTOR_MIN * 100)}
					max={Math.round(GRAPH_DEFAULT_FONT_SIZE_FACTOR_MAX * 100)}
					value={Math.round(labelFontSizeFactor * 100)}
					onChange={updateFontSize}
					max-length={5}
					disabled={!isGraphPresentation}
				/>
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
						{t('graph_font_size_reset')}
					</DBTooltip>
				</DBButton>
			</div>
		</div>
	);
};
