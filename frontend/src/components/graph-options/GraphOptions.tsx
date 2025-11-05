import './GraphOptions.scss';
import { DBSelect } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { ToggleGroup } from 'src/components/toggle-group/ToggleGroup';
import { useGraphStore } from 'src/stores/graph';
import { LayoutModuleType, useSearchStore } from 'src/stores/search';
import {
	GLOBAL_SEARCH_ALGORITHM_KEY,
	GLOBAL_SEARCH_PRESENTATION_KEY,
	GRAPH_LAYOUT_FORCE,
	GRAPH_LAYOUT_FORCE_ATLAS_2,
	GRAPH_LAYOUT_GRAPH_STYLESHEET,
	GRAPH_LAYOUT_NOVERLAP,
	GRAPH_LAYOUT_PERSPECTIVE,
	GRAPH_LAYOUT_RANDOM,
	GRAPH_PRESENTATION_GRAPH,
	GRAPH_PRESENTATION_OBJECT_TABLE,
	GRAPH_PRESENTATION_RESULT_TABLE
} from 'src/utils/constants';
import { GrassfileManager } from '../grassfile-manager/GrassfileManager';
import { GraphOptionsProps } from './GraphOptions.interfaces';

export const GraphOptions = ({ id, className, testId }: GraphOptionsProps) => {
	const { t } = useTranslation();
	const searchStore = useSearchStore((store) => store);
	const [searchParams, setSearchParams] = useSearchParams();
	const perspectiveName = useGraphStore((store) => store.perspectiveName);
	const perspectiveId = useGraphStore((store) => store.perspectiveId);
	const rootElementClassName = clsx('graph-options', className);
	const isPerspectiveAlgorithm = searchStore.algorithm === GRAPH_LAYOUT_PERSPECTIVE;

	const presentationOptions = [
		{
			label: t('data_presentation_graph'),
			value: GRAPH_PRESENTATION_GRAPH,
			icon: 'share',
			key: GRAPH_PRESENTATION_GRAPH
		},
		{
			label: t('data_presentation_object_table'),
			value: GRAPH_PRESENTATION_OBJECT_TABLE,
			icon: 'list',
			key: GRAPH_PRESENTATION_OBJECT_TABLE
		},
		{
			label: t('data_presentation_result_table'),
			value: GRAPH_PRESENTATION_RESULT_TABLE,
			icon: 'grid',
			key: GRAPH_PRESENTATION_RESULT_TABLE
		}
	];

	const algorithmOptions = [
		{
			label: 'Force Atlas 2',
			value: GRAPH_LAYOUT_FORCE_ATLAS_2,
			key: GRAPH_LAYOUT_FORCE_ATLAS_2
		},
		{
			label: 'Force',
			value: GRAPH_LAYOUT_FORCE,
			key: GRAPH_LAYOUT_FORCE
		},
		{
			label: 'Noverlap',
			value: GRAPH_LAYOUT_NOVERLAP,
			key: GRAPH_LAYOUT_NOVERLAP
		},
		{
			label: 'Random',
			value: GRAPH_LAYOUT_RANDOM,
			key: GRAPH_LAYOUT_RANDOM
		},
		{
			label: 'Graph Stylesheet',
			value: GRAPH_LAYOUT_GRAPH_STYLESHEET,
			key: GRAPH_LAYOUT_GRAPH_STYLESHEET
		}
	];

	if (isPerspectiveAlgorithm || perspectiveId) {
		algorithmOptions.push({
			label: `Perspective${perspectiveName ? ': ' + perspectiveName : ''}`,
			value: GRAPH_LAYOUT_PERSPECTIVE,
			key: GRAPH_LAYOUT_PERSPECTIVE
		});
	}

	const onPresentationToggleChange = (value: string) => {
		searchStore.setPresentation(value);
		setUrlParams(GLOBAL_SEARCH_PRESENTATION_KEY, value);
	};

	const selectedPresentationLabel = presentationOptions.find(
		(option) => option.value === searchStore.presentation
	)?.label;

	const onAlgorithmChange = (event: ChangeEvent<HTMLSelectElement>) => {
		searchStore.setAlgorithm(event.target.value as LayoutModuleType);
		setUrlParams(GLOBAL_SEARCH_ALGORITHM_KEY, event.target.value);
	};

	const setUrlParams = (key: string, value: string) => {
		setSearchParams({
			...Object.fromEntries(searchParams),
			[key]: value
		});
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<ToggleGroup
				className="graph-options__presentation-toggle"
				options={presentationOptions}
				value={searchStore.presentation}
				onChange={onPresentationToggleChange}
				selectedLabel={selectedPresentationLabel}
				size="medium"
			/>
			<DBSelect
				className="graph-options__layout-select"
				value={searchStore.algorithm}
				label={t('data_presentation_algorithm_label')}
				options={algorithmOptions}
				onChange={onAlgorithmChange}
				disabled={searchStore.presentation !== GRAPH_PRESENTATION_GRAPH}
			/>
			<GrassfileManager />
		</div>
	);
};
