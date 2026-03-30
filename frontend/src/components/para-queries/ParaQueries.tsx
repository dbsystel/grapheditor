import { DBCustomSelect } from '@db-ux/react-core-components';
import { CustomSelectOptionType } from '@db-ux/react-core-components/dist/components/custom-select/model';
import { GeneralEvent } from '@db-ux/react-core-components/dist/shared/model';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Loading } from 'src/components/loading/Loading';
import { ParaQueryEditor } from 'src/components/para-query-editor/ParaQueryEditor';
import { NodeId } from 'src/models/node';
import { ParaQuery } from 'src/models/paraquery';
import { usePerspectiveStore } from 'src/stores/perspective';
import { useSearchStore } from 'src/stores/search';
import { api } from 'src/utils/api/api';
import {
	GLOBAL_SEARCH_NODE_ID_KEY,
	GLOBAL_SEARCH_PARAMETERS_KEY,
	GLOBAL_SEARCH_TYPE_KEY,
	GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY
} from 'src/utils/constants';
import { isObject, isString } from 'src/utils/helpers/general';
import { useGetParaQueries } from 'src/utils/hooks/useGetParaQueries';
import { useGetParaQuery } from 'src/utils/hooks/useGetParaQuery';
import { ParaQueriesProps } from './ParaQueries.interfaces';

export const ParaQueries = ({ searchFunctionRef, id, className, testId }: ParaQueriesProps) => {
	const { t } = useTranslation();
	const [options, setOptions] = useState<Array<CustomSelectOptionType>>([]);
	const [values, setValues] = useState<Array<NodeId>>([]);
	const [selectedParaQuery, setSelectedParaQuery] = useState<ParaQuery | null>(null);
	const [defaultParameterValues, setDefaultParameterValues] = useState<Record<string, string>>(
		{}
	);
	const [searchParams] = useSearchParams();
	const parametersRef = useRef<Record<string, string>>({});
	const shouldPreselectByIdRef = useRef('');
	const rootElementClassName = clsx('para-queries', className);

	const { reFetch, isLoading } = useGetParaQueries({
		executeImmediately: false,
		onSuccess: (response) => {
			const newOptions: Array<CustomSelectOptionType> = [];

			response.data.paraqueries.forEach((entry) => {
				newOptions.push({ label: entry[1], value: entry[0] });
			});

			setOptions(newOptions);
		}
	});

	const { reFetch: reFetchParaQuery, isLoading: isParaQueryLoading } = useGetParaQuery({
		paraQueryId: '',
		executeImmediately: false,
		onSuccess: (response) => {
			const paraQuery = response.data.paraquery;

			parametersRef.current = {};

			for (const [key, parameter] of Object.entries(paraQuery.parameters)) {
				parametersRef.current[key] = parameter.default_value || '';
			}

			setSelectedParaQuery(paraQuery);

			if (shouldPreselectByIdRef.current) {
				const parameters = useSearchStore
					.getState()
					.getUrlSearchParameter(GLOBAL_SEARCH_PARAMETERS_KEY);

				// preselect the para-query in the dropdown from the URL by its ID
				setValues([shouldPreselectByIdRef.current]);

				// preselect the para-query from the URL
				setSelectedParaQuery(paraQuery);

				// use any parameters from the URL to prefill the parameter values
				if (parameters) {
					const parsedParameters = JSON.parse(parameters);

					if (isObject(parsedParameters)) {
						const stringParams: Record<string, string> = {};

						for (const [key, value] of Object.entries(parsedParameters)) {
							if (isString(key) && isString(value)) {
								stringParams[key] = value;
							}
						}

						parametersRef.current = stringParams;
					}
					setDefaultParameterValues(JSON.parse(parameters));
				}

				shouldPreselectByIdRef.current = '';

				searchFunctionRef.current.triggerSearch();
			}
		}
	});

	useEffect(() => {
		const type = useSearchStore.getState().getUrlSearchParameter(GLOBAL_SEARCH_TYPE_KEY);
		const nodeId = useSearchStore.getState().getUrlSearchParameter(GLOBAL_SEARCH_NODE_ID_KEY);

		if (type === GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY && nodeId) {
			// initialize the component with values from URL
			shouldPreselectByIdRef.current = nodeId;
			reFetchParaQuery({ paraQueryId: nodeId });
		}
	}, [searchParams]);

	const onDropdownToggle = (event: GeneralEvent<HTMLDetailsElement>) => {
		if ('newState' in event && event.newState === 'open') {
			reFetch();
		}
	};

	const onOptionSelected = (values: Array<NodeId>) => {
		const selectedValue = values.at(0);

		if (selectedValue) {
			setValues([selectedValue]);
			reFetchParaQuery({ paraQueryId: selectedValue });
		}
	};

	const onParameterChange = (key: string, value: string) => {
		parametersRef.current[key] = value;
	};

	searchFunctionRef.current.searchFunction = () => {
		const nodeId = values.at(0);
		if (selectedParaQuery && nodeId) {
			usePerspectiveStore.getState().reset();

			api.paraQueries.actions.executeParaQuery(
				selectedParaQuery.cypher,
				parametersRef.current
			);
		}
	};

	const loadingText = t('para_queries_dropdown_loading');
	const noResultsText = t('para_queries_dropdown_no_results');
	const placeholder = t('para_queries_dropdown_placeholder');
	const searchPlaceholder = t('para_queries_dropdown_search_placeholder');

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<DBCustomSelect
				options={options}
				values={values}
				showLabel={false}
				label=""
				showIcon
				formFieldWidth="full"
				dropdownWidth="auto"
				showSearch
				placeholder={placeholder}
				showLoading={isLoading}
				loadingText={loadingText}
				noResultsText={noResultsText}
				showClearSelection={false}
				onDropdownToggle={onDropdownToggle}
				onOptionSelected={onOptionSelected}
				searchPlaceholder={searchPlaceholder}
			/>
			{isParaQueryLoading && <Loading isLoading={isParaQueryLoading} />}
			{selectedParaQuery && (
				<ParaQueryEditor
					paraQuery={selectedParaQuery}
					onParameterChange={onParameterChange}
					defaultParameterValues={defaultParameterValues}
				/>
			)}
		</div>
	);
};
