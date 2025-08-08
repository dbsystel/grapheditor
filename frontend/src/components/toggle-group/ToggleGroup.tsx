import './ToggleGroup.scss';
import { DBButton, DBIcon, DBSection, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useGraphStore } from 'src/stores/graph';
import { useSearchStore } from 'src/stores/search';
import {
	GLOBAL_SEARCH_CYPHER_QUERY_DEFAULT_SEARCH_VALUE,
	GLOBAL_SEARCH_FULL_TEXT_DEFAULT_SEARCH_VALUE,
	GLOBAL_SEARCH_PARAMETER_KEY,
	GLOBAL_SEARCH_TYPE_KEY,
	GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT,
	GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVES,
	GRAPH_LAYOUT_FORCE_ATLAS_2
} from 'src/utils/constants';
import { ToggleGroupProps } from './ToggleGroup.interfaces';

export const ToggleGroup = ({ id, className, testId }: ToggleGroupProps) => {
	const { t } = useTranslation();
	const { type, setType, setSearchValue, getUrlSearchParameter, setAlgorithm } = useSearchStore(
		(store) => store
	);
	const rootElementClassName = clsx('toggle-group', className);

	const onTypeChange = (newType: string) => {
		setType(newType);

		/*
			Here we check the urlParams (query & type) to see if they were set.
			If they weren't set we use default values.
		*/
		const urlType = getUrlSearchParameter(GLOBAL_SEARCH_TYPE_KEY);
		const urlQuery = getUrlSearchParameter(GLOBAL_SEARCH_PARAMETER_KEY);

		if (newType === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT) {
			if (urlType === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT && urlQuery) {
				setSearchValue(urlQuery);
			} else {
				setSearchValue(GLOBAL_SEARCH_FULL_TEXT_DEFAULT_SEARCH_VALUE);
			}
		} else if (newType === GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY) {
			// CR_ML_1
			setAlgorithm(GRAPH_LAYOUT_FORCE_ATLAS_2);
			useGraphStore.getState().setPerspectiveId('');
			useGraphStore.getState().setPerspectiveName('');

			if (urlType === GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY && urlQuery) {
				setSearchValue(urlQuery);
			} else {
				setSearchValue(GLOBAL_SEARCH_CYPHER_QUERY_DEFAULT_SEARCH_VALUE);
			}
		}
	};

	const searchTypeOptions = [
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
		}
	];

	const selectedSearchTypeLabel = searchTypeOptions.find(
		(searchTypeOption) => searchTypeOption.value === type
	)?.label;

	return (
		<DBSection spacing="none" className={rootElementClassName} id={id} data-testid={testId}>
			<div className="toggle-group__select-type">
				{searchTypeOptions.map((searchTypeOption) => (
					<DBButton
						key={searchTypeOption.value}
						size="small"
						type="button"
						noText
						variant={type === searchTypeOption.value ? 'filled' : 'ghost'}
						onClick={() => onTypeChange(searchTypeOption.value)}
						className={type === searchTypeOption.value ? 'toggle-group--selected' : ''}
					>
						<DBIcon icon={searchTypeOption.icon} />
						<DBTooltip placement="bottom-start" showArrow={false}>
							{searchTypeOption.label}
						</DBTooltip>
					</DBButton>
				))}
			</div>

			<div>
				<p>
					<strong>{selectedSearchTypeLabel}</strong>
				</p>
			</div>
		</DBSection>
	);
};
