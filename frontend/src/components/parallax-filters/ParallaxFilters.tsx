import './ParallaxFilters.scss';
import { DBButton, DBCustomSelect, DBIcon, DBInput } from '@db-ux/react-core-components';
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
import { ParallaxFiltersLabelsDropdown, ParallaxFiltersProps } from './ParallaxFilters.interfaces';

export const ParallaxFilters = ({ id, className, testId }: ParallaxFiltersProps) => {
	const { t } = useTranslation();
	const parallaxData = useParallaxStore((store) => store.parallaxData);
	const parallaxHistory = useParallaxStore((store) => store.history);
	const currentParallaxHistoryIndex = useParallaxStore((store) => store.currentHistoryIndex);
	const initialParallaxQuery = useParallaxStore((store) => store.initialQuery);
	const setParallaxData = useParallaxStore((store) => store.setParallaxData);
	const setParallaxInitialQuery = useParallaxStore((store) => store.setInitialQuery);
	const setParallaxIsLoading = useParallaxStore((store) => store.setIsLoading);
	const isLoading = useParallaxStore((store) => store.isLoading);
	const setParallaxHistory = useParallaxStore((store) => store.setHistory);
	const setResult = useSearchStore((store) => store.setResult);
	// can't manage this state with "defaultValue" prop as we did with the DBInput component (probably
	// because we are not managing the "key" prop)
	const [labelsFilterDropdown, setLabelsFilterDropdown] = useState<ParallaxFiltersLabelsDropdown>(
		{
			options: [],
			values: []
		}
	);
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
						label: idFormatter.parseIdToName(labelId),
						value: labelId
					};
				}),
				values: filtersRef.current.labels
			});
		}
	}, [currentParallaxHistoryIndex, initialParallaxQuery, parallaxHistory]);

	const applyPropertyFilters = () => {
		const initialQuery = clone(initialParallaxQuery);
		const propertyFilters = filtersRef.current.properties;
		const labelFilters = labelsFilterDropdown.values;
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
	};

	const labelsTitle = t('parallax_filters_labels_title');
	const propertiesTitle = t('parallax_filters_properties_title');
	const applyButtonTitle = t('parallax_filters_apply_button_title');
	const labelSelectPlaceholder = t('parallax_filters_select_placeholder');
	const labelSelectSearchPlaceholder = t('parallax_filters_select_search_placeholder');
	const labelSelectNoResultsText = t('parallax_filters_select_no_results_text');
	const labelSelectSelectAllLabel = t('parallax_filters_select_select_all_label');
	const noParallaxDataMessage = t('parallax_next_steps_no_parallax_data_message');

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{!parallaxData ? (
				<p>
					<DBIcon icon="information_circle" /> {noParallaxDataMessage}
				</p>
			) : (
				<div className="parallax-filters__content">
					<h6>{labelsTitle}</h6>
					<DBCustomSelect
						options={labelsFilterDropdown.options}
						values={labelsFilterDropdown.values}
						showLabel={false}
						placeholder={labelSelectPlaceholder}
						showSearch={true}
						searchPlaceholder={labelSelectSearchPlaceholder}
						noResultsText={labelSelectNoResultsText}
						showIcon={false}
						showClearSelection={true}
						onOptionSelected={onLabelsFilterChange}
						dropdownWidth="full"
						label=""
						selectAllLabel={labelSelectSelectAllLabel}
						multiple={true}
					/>

					<h6>{propertiesTitle}</h6>
					<div className="parallax-filters__filters">
						{parallaxData.properties.map((propertyId, index) => {
							const label = idFormatter.parseIdToName(propertyId);
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
						<DBButton
							onClick={applyPropertyFilters}
							variant="brand"
							disabled={isLoading || !parallaxData}
						>
							{applyButtonTitle}
						</DBButton>
					</div>
				</div>
			)}
		</div>
	);
};
