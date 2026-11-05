import { CustomSelectOptionType, DBCustomSelect } from '@db-ux/react-core-components';
import { GeneralEvent } from '@db-ux/react-core-components/dist/shared/model';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loading } from 'src/components/loading/Loading';
import { ParaQueryEditor } from 'src/components/para-query-editor/ParaQueryEditor';
import { ParaQueryEditorHandle } from 'src/components/para-query-editor/ParaQueryEditor.interfaces';
import { NodeId } from 'src/models/node';
import { ParaQuery } from 'src/models/paraquery';
import { useDatabaseStore } from 'src/stores/database';
import { usePerspectiveStore } from 'src/stores/perspective';
import { api } from 'src/utils/api/api';
import { NOT_AVAILABLE_SIGN } from 'src/utils/constants';
import { useGetParaQueries } from 'src/utils/hooks/useGetParaQueries';
import { usePostParaQuery } from 'src/utils/hooks/usePostParaQuery';
import { ParaQueriesProps } from './ParaQueries.interfaces';

export const ParaQueries = ({ searchFunctionRef, id, className, testId }: ParaQueriesProps) => {
	const { t } = useTranslation();
	const currentDatabase = useDatabaseStore((store) => store.currentDatabase);
	const [options, setOptions] = useState<Array<CustomSelectOptionType>>([]);
	const [values, setValues] = useState<Array<NodeId>>([]);
	const [selectedParaQuery, setSelectedParaQuery] = useState<ParaQuery | null>(null);
	const handleRef = useRef<ParaQueryEditorHandle>({
		getParameterValues: () => {
			return {};
		}
	});
	const rootElementClassName = clsx('para-queries', className);

	const { reFetch, isLoading } = useGetParaQueries({
		executeImmediately: false,
		onSuccess: (response) => {
			const newOptions: Array<CustomSelectOptionType> = [];

			response.data.paraqueries.forEach((entry) => {
				newOptions.push({ label: entry[1] || NOT_AVAILABLE_SIGN, value: entry[0] });
			});

			setOptions(newOptions);
		}
	});

	const { reFetch: reFetchParaQuery, isLoading: isParaQueryLoading } = usePostParaQuery({
		paraQueryId: '',
		executeImmediately: false,
		onSuccess: (response) => {
			const paraQuery = response.data.paraquery;

			setSelectedParaQuery(paraQuery);
		},
		onError: () => {
			setValues([]);
			setSelectedParaQuery(null);

			// remove timeout after https://github.com/db-ux-design-system/core-web/issues/6488 is resolved
			window.setTimeout(() => {
				setOptions([]);
			}, 50);
		}
	});

	useEffect(() => {
		const selectedValue = values.at(0);

		if (selectedValue) {
			reFetchParaQuery({ paraQueryId: selectedValue });
		}
	}, [currentDatabase]);

	const onDropdownToggle = (event: GeneralEvent<HTMLDetailsElement>) => {
		if ('newState' in event && event.newState === 'open') {
			reFetch();
		}
	};

	const onOptionSelected = (values: Array<NodeId>) => {
		const newlySelectedValue = values.at(0);

		if (newlySelectedValue) {
			setValues([newlySelectedValue]);
			reFetchParaQuery({ paraQueryId: newlySelectedValue, parameters: {} });
		}
	};

	searchFunctionRef.current.searchFunction = () => {
		const nodeId = values.at(0);
		if (selectedParaQuery && nodeId) {
			usePerspectiveStore.getState().reset();

			console.log(handleRef.current.getParameterValues());

			api.paraQueries.actions.executeParaQuery(
				selectedParaQuery.cypher,
				handleRef.current.getParameterValues()
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
				<ParaQueryEditor paraQuery={selectedParaQuery} handleRef={handleRef} />
			)}
		</div>
	);
};
