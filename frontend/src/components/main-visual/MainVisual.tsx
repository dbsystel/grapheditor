import './MainVisual.scss';
import { DBSection } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobalSearchResultsObjectTable } from 'src/components/global-search-results-object-table/GlobalSearchResultsObjectTable';
import { GlobalSearchResultsTable } from 'src/components/global-search-results-table/GlobalSearchResultsTable';
import { Loading } from 'src/components/loading/Loading';
import { processResultCell } from 'src/components/main-visual/helpers';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useSearchStore } from 'src/stores/search';
import { useSettingsStore } from 'src/stores/settings';
import {
	GRAPH_PRESENTATION_GRAPH,
	GRAPH_PRESENTATION_OBJECT_TABLE,
	GRAPH_PRESENTATION_RESULT_TABLE
} from 'src/utils/constants';
import { postRelationsByNodeIds } from 'src/utils/fetch/postRelationsByNodeIds';
import { MainVisualProps } from './MainVisual.interfaces';

const NetworkGraph = lazy(() =>
	import('src/components/network-graph/NetworkGraph').then((module) => {
		return {
			default: module['NetworkGraph']
		};
	})
);

/**
 * A main visual results page.
 * It will try and fetch query results on each GLOBAL_SEARCH_PARAMETER_KEY search
 * parameter change.
 */
export const MainVisual = ({ id, className, testId }: MainVisualProps) => {
	const { t } = useTranslation();
	const presentation = useSearchStore((store) => store.presentation);
	const result = useSearchStore((store) => store.result);
	const setIsResultProcessed = useSearchStore((store) => store.setIsResultProcessed);
	const isResultProcessed = useSearchStore((store) => store.isResultProcessed);
	const isLoading = useSearchStore((store) => store.isLoading);
	const setNodes = useItemsStore((store) => store.setNodes);
	const clearNodes = useItemsStore((store) => store.clearNodes);
	const setRelations = useItemsStore((store) => store.setRelations);
	const clearRelations = useItemsStore((store) => store.clearRelations);
	const perspectiveId = useGraphStore((store) => store.perspectiveId);
	const setNodeIdsToRender = useGraphStore((store) => store.setNodeIdsToRender);
	const setRelationIdsToRender = useGraphStore((store) => store.setRelationIdsToRender);
	const rootElementClassName = clsx('main-visual', className);
	const dataLoadedAtLeastOnce = useRef(isLoading);

	useEffect(() => {
		if (perspectiveId) {
			dataLoadedAtLeastOnce.current = true;
		}
	}, [perspectiveId]);

	useEffect(() => {
		(async () => {
			setIsResultProcessed(false);

			if (result) {
				const { nodesMap, relationsMap } = processResultCell(result);

				if (nodesMap.size && useSettingsStore.getState().isAutoconnectEnabled) {
					const response = await postRelationsByNodeIds({
						additionalNodeIds: Array.from(nodesMap.keys())
					});

					response.data.forEach((relation) => {
						if (!relationsMap.has(relation.id)) {
							relationsMap.set(relation.id, relation);
						}
					});
				}

				dataLoadedAtLeastOnce.current = true;

				clearNodes(true);
				clearRelations(true);
				setNodes(Array.from(nodesMap.values()));
				setRelations(Array.from(relationsMap.values()));
				setNodeIdsToRender(Array.from(nodesMap.keys()));
				setRelationIdsToRender(Array.from(relationsMap.keys()));
				setIsResultProcessed(true);
			}
		})();
	}, [result]);

	if (dataLoadedAtLeastOnce.current === false) {
		return (
			<DBSection spacing="none" className="main-visual__pre-render">
				<p>{t('main_visual_no_results')}</p>
			</DBSection>
		);
	}

	if (isLoading || !isResultProcessed) {
		return (
			<DBSection spacing="none" className="main-visual__pre-render">
				<Loading isLoading={true} />
			</DBSection>
		);
	}

	if (result === null || result.length === 0) {
		return (
			<DBSection spacing="none" className="main-visual__pre-render">
				<p>{t('no_global_search_results_to_render')}</p>
			</DBSection>
		);
	}

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{presentation === GRAPH_PRESENTATION_RESULT_TABLE && (
				<DBSection className="main-visual__tables" spacing="none">
					<GlobalSearchResultsTable />
				</DBSection>
			)}

			{presentation === GRAPH_PRESENTATION_OBJECT_TABLE && (
				<DBSection className="main-visual__tables" spacing="none">
					<GlobalSearchResultsObjectTable />
				</DBSection>
			)}

			{presentation === GRAPH_PRESENTATION_GRAPH && (
				<Suspense
					fallback={
						<DBSection spacing="none">
							<Loading isLoading={true} />
						</DBSection>
					}
				>
					<NetworkGraph />
				</Suspense>
			)}
		</div>
	);
};
