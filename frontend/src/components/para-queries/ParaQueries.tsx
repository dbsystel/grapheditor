import './ParaQueries.scss';
import { DBCustomSelect, DBInput } from '@db-ux/react-core-components';
import { CustomSelectOptionType } from '@db-ux/react-core-components/dist/components/custom-select/model';
import { GeneralEvent } from '@db-ux/react-core-components/dist/shared/model';
import clsx from 'clsx';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { NodeId } from 'src/models/node';
import { ParaQuery } from 'src/models/paraquery';
import { useGraphStore } from 'src/stores/graph';
import { useSearchStore } from 'src/stores/search';
import { objectContainsKey } from 'src/utils/helpers/general';
import { useGetParaQueries } from 'src/utils/hooks/useGetParaQueries';
import { ParaQueriesProps, ParaQueryEditorProps } from './ParaQueries.interfaces';

export const ParaQueries = ({ ref, id, className, testId }: ParaQueriesProps) => {
	const { t } = useTranslation();
	const [options, setOptions] = useState<Array<CustomSelectOptionType>>([]);
	const [values, setValues] = useState<Array<NodeId>>([]);
	const [selectedParaQuery, setSelectedParaQuery] = useState<ParaQuery | null>(null);
	const paraQueriesRef = useRef<Record<NodeId, ParaQuery>>({});
	const parametersRef = useRef<Record<string, string>>({});
	const rootElementClassName = clsx('para-queries', className);

	const { reFetch, isLoading } = useGetParaQueries({
		executeImmediately: false,
		onSuccess: (response) => {
			const newOptions: Array<CustomSelectOptionType> = [];

			for (const [nodeId, paraQuery] of Object.entries(response.data.paraqueries)) {
				newOptions.push({ label: paraQuery.description, value: nodeId });
			}

			setOptions(newOptions);
			paraQueriesRef.current = response.data.paraqueries;
		},
		onError: () => {}
	});

	const onDropdownToggle = (event: GeneralEvent<HTMLDetailsElement>) => {
		if ('newState' in event && event.newState === 'open') {
			reFetch();
		}
	};

	const onOptionSelected = (values: Array<NodeId>) => {
		const selectedValue = values.at(0);
		const localSelectedParaQuery = selectedValue ? paraQueriesRef.current[selectedValue] : null;

		parametersRef.current = {};

		if (localSelectedParaQuery) {
			for (const [key, parameter] of Object.entries(localSelectedParaQuery.parameters)) {
				parametersRef.current[key] = parameter.default_value || '';
			}
		}

		setValues(values);
		setSelectedParaQuery(localSelectedParaQuery);
	};

	const onParameterChange = (key: string, value: string) => {
		parametersRef.current[key] = value;
	};

	ref.current.triggerSearch = () => {
		if (selectedParaQuery) {
			useGraphStore.getState().clearPerspective();
			useSearchStore.getState().setQuery(selectedParaQuery.cypher);
			useSearchStore.getState().setCypherQueryParameters(parametersRef.current);
			useSearchStore.getState().executeSearch();
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
			{selectedParaQuery && (
				<ParaQueryEditor
					paraQuery={selectedParaQuery}
					onParameterChange={onParameterChange}
				/>
			)}
		</div>
	);
};

const ParaQueryEditor = ({ paraQuery, onParameterChange }: ParaQueryEditorProps) => {
	const [paraQueryParameterKeys, setParaQueryParameterKeys] = useState<Array<string>>([]);
	const rootElementRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const rootElement = rootElementRef.current;

		if (rootElement) {
			// search for words starting with $ sign
			const parametersInsideText = paraQuery.user_text.match(/\$\w+/gim);

			if (parametersInsideText) {
				const cleanParameterKeys: Array<string> = [];

				// replace words with $ sign with a HTML container (used later by React Portal)
				rootElement.innerHTML = paraQuery.user_text.replaceAll(/\$\w+/gim, (match) => {
					const cleanParameterKey = match.substring(1);
					cleanParameterKeys.push(cleanParameterKey);

					return `<div data-para-query-parameter="${cleanParameterKey}"></div>`;
				});

				setParaQueryParameterKeys(cleanParameterKeys);
			}
		}
	}, [paraQuery]);

	const renderWord = (parameterKey: string) => {
		const parameter = objectContainsKey(paraQuery.parameters, parameterKey || '')
			? paraQuery.parameters[parameterKey || '']
			: null;

		if (!parameter || parameter.type !== 'string') {
			return '';
		}

		const onChange = (event: ChangeEvent<HTMLInputElement>) => {
			onParameterChange(parameterKey, event.target.value);
		};

		return (
			<DBInput
				label={parameter.help_text}
				defaultValue={parameter.default_value}
				onChange={onChange}
				dataList={parameter.suggestions}
			/>
		);
	};

	return (
		<div className="para-queries__editor" ref={rootElementRef}>
			{paraQuery.user_text}
			{paraQueryParameterKeys.map((parameterKey) => {
				const targetElement = document.querySelector(
					`[data-para-query-parameter="${parameterKey}"]`
				);

				if (targetElement) {
					return createPortal(renderWord(parameterKey), targetElement);
				} else {
					return null;
				}
			})}
		</div>
	);
};
