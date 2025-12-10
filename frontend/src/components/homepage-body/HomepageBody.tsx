import './HomepageBody.scss';
import { DBButton, DBCard } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Logo } from 'src/components/logo/Logo';
import { NetworkGraph } from 'src/components/network-graph/NetworkGraph';
import { Queries } from 'src/components/queries/Queries';
import { HomepageData, HomepageQuery } from 'src/models/general';
import { useItemsStore } from 'src/stores/items';
import { useSearchStore } from 'src/stores/search';
import { nodesApi } from 'src/utils/api/nodes';
import { searchApi } from 'src/utils/api/search';
import {
	GLOBAL_SEARCH_NODE_ID_KEY,
	GLOBAL_SEARCH_PARAMETERS_KEY,
	GLOBAL_SEARCH_QUERY_KEY,
	GLOBAL_SEARCH_TYPE_KEY,
	GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE,
	GraphEditorTypeSimplified
} from 'src/utils/constants';
import { getHomepageData } from 'src/utils/fetch/getHomepageData';
import { goToApplicationView, isString } from 'src/utils/helpers/general';
import { isValidSearchType } from 'src/utils/helpers/search';
import { idFormatter } from 'src/utils/idFormatter';
import { HomepageBodyProps } from './HomepageBody.interfaces';

export const HomepageBody = ({ id, className, testId }: HomepageBodyProps) => {
	const { t } = useTranslation();
	const [searchParams, setSearchParameters] = useSearchParams();
	const [homepageData, setHomepageData] = useState<HomepageData | null>(null);
	const [shouldRenderGraph, setShouldRenderGraph] = useState<boolean>(false);
	const rootElementClassName = clsx('homepage-body', className);

	useEffect(() => {
		const unSubscribe = useItemsStore.subscribe(
			(store) => store.nodes,
			() => {
				unSubscribe();
				setShouldRenderGraph(true);
			}
		);

		getHomepageData().then((response) => {
			setHomepageData(response.data);

			executeQuery(response.data.graphQuery, true);
		});

		return () => {
			unSubscribe();
		};
	}, []);

	const executeQuery = (query: HomepageQuery, isPreview?: boolean) => {
		// TODO refactor, very similar to frontend/src/components/global-search/GlobalSearch.tsx
		if (isValidSearchType(query.type)) {
			const {
				query: queryQuery,
				type: queryType,
				nodeId: queryNodeId,
				queryParameters
			} = query;

			if (!isPreview) {
				const newSearchParameters: Record<string, string> = {
					...Object.fromEntries(searchParams),
					[GLOBAL_SEARCH_TYPE_KEY]: queryType
				};

				useSearchStore.getState().setType(queryType);

				if (queryQuery) {
					useSearchStore.getState().setQuery(queryQuery);
					newSearchParameters[GLOBAL_SEARCH_QUERY_KEY] = queryQuery;

					if (
						queryType !== GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY &&
						queryType !== GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE
					) {
						useSearchStore.getState().setSearchValue(queryQuery);
						useSearchStore.getState().addHistoryEntry(queryType, queryQuery);
					}
				}

				if (queryParameters) {
					useSearchStore.getState().setCypherQueryParameters(queryParameters);
					newSearchParameters[GLOBAL_SEARCH_PARAMETERS_KEY] =
						JSON.stringify(queryParameters);
				}

				if (queryNodeId) {
					newSearchParameters[GLOBAL_SEARCH_NODE_ID_KEY] = queryNodeId;
				}

				setSearchParameters(newSearchParameters);

				// if para-query, need to fetch the node to get the actual cypher query
				if (queryType === GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY && queryNodeId) {
					nodesApi.postNodesBulkFetch({ nodeIds: [queryNodeId] }).then((response) => {
						const queryProperty =
							response.at(0)?.properties[
								idFormatter.formatSemanticId(
									GraphEditorTypeSimplified.META_PROPERTY,
									'cypher__tech_'
								)
							];

						if (queryProperty) {
							const paraQueryText = queryProperty.value;

							if (isString(paraQueryText)) {
								useSearchStore.getState().setQuery(paraQueryText);
								searchApi.executeSearch();
							}
						}
					});
				} else {
					searchApi.executeSearch();
				}

				goToApplicationView();
			} else {
				searchApi.executeSearch({
					type: queryType,
					query: queryQuery,
					cypherQueryParameters: queryParameters
				});
			}
		}
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{homepageData && (
				<>
					<div className="homepage-body__header-line">
						<Logo className="homepage-body__logo" />
						<h1>{t(homepageData.title || 'homepage_title')}</h1>
					</div>
					<div className="homepage-body__content">
						<div className="homepage-body__queries-block">
							<h3>{t(homepageData.queriesTitle || 'homepage_queries_title')}</h3>
							<Queries
								className="homepage-body__queries"
								queries={homepageData.queriesList}
								onPlayClick={executeQuery}
							/>
						</div>
						<div className="homepage-body__graph-block">
							<div className="homepage-body__graph-title-block">
								<h3>{t(homepageData.graphTitle || 'homepage_graph_title')}</h3>
								<DBButton
									icon="play"
									variant="brand"
									noText={true}
									onClick={() => executeQuery(homepageData.graphQuery)}
								/>
							</div>
							{shouldRenderGraph && (
								<DBCard className="homepage-body__graph-card" spacing="small">
									<NetworkGraph />
								</DBCard>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
};
