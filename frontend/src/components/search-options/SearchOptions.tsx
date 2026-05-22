import { useTranslation } from 'react-i18next';
import { ToggleGroup } from 'src/components/toggle-group/ToggleGroup';
import { ToggleGroupOption } from 'src/components/toggle-group/ToggleGroup.interfaces';
import { useDatabaseStore } from 'src/stores/database';
import { SearchStoreType, useSearchStore } from 'src/stores/search';
import {
	GLOBAL_SEARCH_QUERY_KEY,
	GLOBAL_SEARCH_TYPE_KEY,
	GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT,
	GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE
} from 'src/utils/constants';
import { databaseSupportsPerspectives } from 'src/utils/helpers/database';
import { SearchOptionsProps } from './SearchOptions.interfaces';

export const SearchOptions = ({ id, className, testId }: SearchOptionsProps) => {
	const { t } = useTranslation();
	const { type, setType, setSearchValue, getUrlSearchParameter, getDefaultSearchValue } =
		useSearchStore((store) => store);
	const currentDatabase = useDatabaseStore((store) => store.currentDatabase);
	const isPerspectivesSupported = currentDatabase
		? databaseSupportsPerspectives(currentDatabase)
		: false;

	const onTypeChange = (newType: SearchStoreType) => {
		setType(newType);

		const urlType = getUrlSearchParameter(GLOBAL_SEARCH_TYPE_KEY);
		const urlQuery = getUrlSearchParameter(GLOBAL_SEARCH_QUERY_KEY);

		if (newType === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT) {
			if (urlType === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT && urlQuery) {
				setSearchValue(urlQuery);
			} else {
				setSearchValue(getDefaultSearchValue(newType));
			}
		} else if (newType === GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY) {
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
			value: GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE,
			label: t(
				isPerspectivesSupported
					? 'global_search_perspective'
					: 'global_search_perspective_not_supported_by_database'
			),
			icon: 'scan_eye',
			isDisabled: !isPerspectivesSupported
		},
		{
			value: GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY,
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
