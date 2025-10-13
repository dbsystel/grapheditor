import { useTranslation } from 'react-i18next';
import { ToggleGroup } from 'src/components/toggle-group/ToggleGroup';
import { ToggleGroupOption } from 'src/components/toggle-group/ToggleGroup.interfaces';
import { useGraphStore } from 'src/stores/graph';
import { SearchStoreType, useSearchStore } from 'src/stores/search';
import {
	GLOBAL_SEARCH_PARAMETER_KEY,
	GLOBAL_SEARCH_TYPE_KEY,
	GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT,
	GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERIES,
	GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVES,
	GRAPH_LAYOUT_FORCE_ATLAS_2
} from 'src/utils/constants';
import { SearchOptionsProps } from './SearchOptions.interfaces';

export const SearchOptions = ({ id, className, testId }: SearchOptionsProps) => {
	const { t } = useTranslation();
	const {
		type,
		setType,
		setSearchValue,
		getUrlSearchParameter,
		setAlgorithm,
		getDefaultSearchValue
	} = useSearchStore((store) => store);

	const onTypeChange = (newType: SearchStoreType) => {
		setType(newType);

		const urlType = getUrlSearchParameter(GLOBAL_SEARCH_TYPE_KEY);
		const urlQuery = getUrlSearchParameter(GLOBAL_SEARCH_PARAMETER_KEY);

		if (newType === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT) {
			if (urlType === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT && urlQuery) {
				setSearchValue(urlQuery);
			} else {
				setSearchValue(getDefaultSearchValue(newType));
			}
		} else if (newType === GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY) {
			setAlgorithm(GRAPH_LAYOUT_FORCE_ATLAS_2);
			useGraphStore.getState().setPerspectiveId('');
			useGraphStore.getState().setPerspectiveName('');

			if (urlType === GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY && urlQuery) {
				setSearchValue(urlQuery);
			} else {
				setSearchValue(getDefaultSearchValue(newType));
			}
		}
	};

	const searchTypeOptions: ToggleGroupOption<SearchStoreType>[] = [
		{
			value: GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
			label: t('global_search_cypher_query'),
			icon: 'cypher'
		},
		{
			value: GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT,
			label: t('global_search_full_text'),
			icon: 'magnifying_glass'
		},
		{
			value: GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVES,
			label: t('global_search_perspective'),
			icon: 'scan_eye'
		},
		{
			value: GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERIES,
			label: 'ParaQueries',
			icon: 'pen'
		}
	];

	const selectedSearchTypeLabel = searchTypeOptions.find(
		(option) => option.value === type
	)?.label;

	return (
		<ToggleGroup
			id={id}
			className={className}
			testId={testId}
			options={searchTypeOptions}
			value={type}
			onChange={onTypeChange}
			selectedLabel={selectedSearchTypeLabel}
			size="small"
		/>
	);
};
