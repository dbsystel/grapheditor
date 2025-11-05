import './MainVisual.scss';
import { DBSection } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { lazy, Suspense, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobalSearchResultsObjectTable } from 'src/components/global-search-results-object-table/GlobalSearchResultsObjectTable';
import { GlobalSearchResultsTable } from 'src/components/global-search-results-table/GlobalSearchResultsTable';
import { Loading } from 'src/components/loading/Loading';
import { useSearchStore } from 'src/stores/search';
import {
	GRAPH_PRESENTATION_GRAPH,
	GRAPH_PRESENTATION_OBJECT_TABLE,
	GRAPH_PRESENTATION_RESULT_TABLE
} from 'src/utils/constants';
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
	const isResultProcessed = useSearchStore((store) => store.isResultProcessed);
	const isLoading = useSearchStore((store) => store.isLoading);
	const rootElementClassName = clsx('main-visual', className);
	const dataLoadedAtLeastOnce = useRef(isLoading);

	useMemo(() => {
		if (result.data) {
			dataLoadedAtLeastOnce.current = true;
		}
	}, [result]);

	const preRenderClassName = rootElementClassName + 'main-visual__pre-render';

	if (dataLoadedAtLeastOnce.current === false) {
		return (
			<DBSection spacing="none" className={preRenderClassName}>
				<p>{t('main_visual_no_results')}</p>
			</DBSection>
		);
	}

	if (isLoading || !isResultProcessed) {
		return (
			<DBSection spacing="none" className={preRenderClassName}>
				<Loading isLoading={true} />
			</DBSection>
		);
	}

	if (result.data === null || result.data.length === 0) {
		return (
			<DBSection spacing="none" className={preRenderClassName}>
				<p>{t('no_global_search_results_to_render')}</p>
			</DBSection>
		);
	}

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{presentation === GRAPH_PRESENTATION_RESULT_TABLE && (
				<DBSection spacing="none">
					<GlobalSearchResultsTable />
				</DBSection>
			)}

			{presentation === GRAPH_PRESENTATION_OBJECT_TABLE && (
				<DBSection spacing="none">
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
