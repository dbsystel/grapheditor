import './ParallaxFilters.scss';
import { DBButton, DBCustomSelect, DBInput } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NodeLabelId } from 'src/models/node';
import { ParallaxFilters as ParallaxFiltersType } from 'src/models/parallax';
import { useParallaxStore } from 'src/stores/parallax';
import { useSearchStore } from 'src/stores/search';
import { parallaxApi } from 'src/utils/api/parallax';
import { clone } from 'src/utils/helpers/general';
import { buildSimpleSearchResult } from 'src/utils/helpers/search';
import { idFormatter } from 'src/utils/idFormatter';
import { ParallaxFiltersProps } from './ParallaxFilters.interfaces';

export const ParallaxFilters = ({ id, className, testId }: ParallaxFiltersProps) => {
	const { t } = useTranslation();
	const parallaxData = useParallaxStore((store) => store.parallaxData);
	const parallaxHistory = useParallaxStore((store) => store.history);
	const currentParallaxHistoryIndex = useParallaxStore((store) => store.currentHistoryIndex);
	const initialParallaxQuery = useParallaxStore((store) => store.initialQuery);
	const setParallaxData = useParallaxStore((store) => store.setParallaxData);
	const setParallaxInitialQuery = useParallaxStore((store) => store.setInitialQuery);
	const setParallaxIsLoading = useParallaxStore((store) => store.setIsLoading);
	const setParallaxHistory = useParallaxStore((store) => store.setHistory);
	const setResult = useSearchStore((store) => store.setResult);
	const [labelsFilterDropdown, setLabelsFilterDropdown] = useState<{
		options: Array<{ label: string; value: NodeLabelId }>;
		values: Array<NodeLabelId>;
	}>({
		options: [],
		values: []
	});
	const filtersRef = useRef<ParallaxFiltersType>({ properties: {}, labels: [] });
	const rootElementClassName = clsx('parallax-filters', className);

	useMemo(() => {
		filtersRef.current = { properties: {}, labels: [] };
		const selectedHistory = parallaxHistory.at(currentParallaxHistoryIndex);

		if (currentParallaxHistoryIndex === -1) {
			filtersRef.current = clone(initialParallaxQuery.filters);
		} else if (selectedHistory) {
			filtersRef.current = clone(selectedHistory.filters);
		}

		if (parallaxData) {
			setLabelsFilterDropdown({
				options: parallaxData.labels.map((labelId) => {
					return {
						label: idFormatter.parseIdToName(labelId, true),
						value: labelId
					};
				}),
				values: filtersRef.current.labels
			});
		}
	}, [currentParallaxHistoryIndex, initialParallaxQuery, parallaxHistory]);

	if (!parallaxData) {
		return;
	}

	const applyPropertyFilters = () => {
		const initialQuery = clone(initialParallaxQuery);
		const propertyFilters = filtersRef.current.properties;
		const labelFilters = filtersRef.current.labels;
		const history = clone(parallaxHistory);
		const currentHistoryIndex = useParallaxStore.getState().currentHistoryIndex;
		const propertyFiltersWithValues: Record<string, string> = {};

		for (const [key, value] of Object.entries(propertyFilters)) {
			if (value.trim()) {
				propertyFiltersWithValues[key] = value;
			}
		}

		if (currentHistoryIndex === -1) {
			initialQuery.filters.properties = propertyFiltersWithValues;
			initialQuery.filters.labels = labelFilters;
		} else {
			history[currentHistoryIndex].filters.properties = propertyFiltersWithValues;
			history[currentHistoryIndex].filters.labels = labelFilters;
		}

		const slicedHistory = history.slice(0, currentHistoryIndex + 1);

		setParallaxIsLoading(true);

		parallaxApi
			.postParallax({
				nodeIds: initialQuery.nodeIds,
				filters: initialQuery.filters,
				steps: slicedHistory
			})
			.then((response) => {
				setResult(buildSimpleSearchResult(Object.values(response.data.nodes)), 'parallax');
				setParallaxData(response.data);
				setParallaxInitialQuery(initialQuery);
				setParallaxHistory(slicedHistory);
			})
			.finally(() => {
				setParallaxIsLoading(false);
			});
	};

	const onLabelsFilterChange = (values: Array<NodeLabelId>) => {
		setLabelsFilterDropdown({
			options: labelsFilterDropdown.options,
			values: values
		});
		// actually not need since we already store labels filter in a state, but leave it for now
		// until the code finalizes
		filtersRef.current.labels = values;
	};

	const labelsTitle = t('parallax_filters_labels_title');
	const propertiesTitle = t('parallax_filters_properties_title');
	const applyButtonTitle = t('parallax_filters_apply_button_title');

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<div className="parallax-filters__content">
				<h6>{labelsTitle}</h6>
				<DBCustomSelect
					options={labelsFilterDropdown.options}
					values={labelsFilterDropdown.values}
					showLabel={false}
					placeholder=""
					showSearch={true}
					searchPlaceholder="Search placeholder"
					noResultsText="No results"
					showIcon={false}
					showClearSelection={true}
					onOptionSelected={onLabelsFilterChange}
					dropdownWidth="full"
					label=""
					selectAllLabel="Select all"
					multiple={true}
				/>

				<h6>{propertiesTitle}</h6>
				<div className="parallax-filters__filters">
					{parallaxData.properties.map((propertyId, index) => {
						const label = idFormatter.parseIdToName(propertyId, true);
						const defaultValue = filtersRef.current.properties[propertyId];

						const onChange = (event: ChangeEvent<HTMLInputElement>) => {
							if (event.target.value.trim()) {
								filtersRef.current.properties[propertyId] = event.target.value;
							} else {
								delete filtersRef.current.properties[propertyId];
							}
						};

						return (
							<div
								className="parallax-filters__filter"
								key={propertyId + '-' + index}
							>
								<DBInput
									defaultValue={defaultValue}
									label={label}
									placeholder=""
									validation="no-validation"
									onChange={onChange}
								/>
							</div>
						);
					})}
					<DBButton onClick={applyPropertyFilters}>{applyButtonTitle}</DBButton>
				</div>
			</div>
		</div>
	);
};
