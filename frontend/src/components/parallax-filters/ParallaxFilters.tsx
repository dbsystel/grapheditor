import './ParallaxFilters.scss';
import { DBButton, DBCustomSelect, DBIcon, DBInput } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { Loading } from 'src/components/loading/Loading';
import { NodeLabelId } from 'src/models/node';
import { ParallaxFilters as ParallaxFiltersType } from 'src/models/parallax';
import { useParallaxStore } from 'src/stores/parallax';
import { parallaxApi } from 'src/utils/api/parallax';
import { clone } from 'src/utils/helpers/general';
import { getNodeSemanticIdOrId } from 'src/utils/helpers/nodes';
import { idFormatter } from 'src/utils/idFormatter';
import { ParallaxFiltersProps } from './ParallaxFilters.interfaces';

export const ParallaxFilters = ({ id, className, testId }: ParallaxFiltersProps) => {
	const { t } = useTranslation();
	const parallaxData = useParallaxStore((store) => store.parallaxData);
	const parallaxHistory = useParallaxStore((store) => store.history);
	const currentParallaxHistoryIndex = useParallaxStore((store) => store.currentHistoryIndex);
	const initialParallaxQuery = useParallaxStore((store) => store.initialQuery);
	const isParallaxLoading = useParallaxStore((store) => store.isLoading);
	const [, setRenderKey] = useState(window.crypto.randomUUID());
	// can't manage this state with "defaultValue" prop as we did with the DBInput component (probably
	// because we are not managing the "key" prop)
	const [labelsFilterDropdown, setLabelsFilterDropdown] = useState<
		Array<{ label: string; value: NodeLabelId }>
	>([]);
	// TODO refactor to use separate states for properties and labels values
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
			setLabelsFilterDropdown(
				parallaxData.labels.map((labelNode) => {
					return {
						label: idFormatter.parseIdToName(labelNode.title),
						value: getNodeSemanticIdOrId(labelNode)
					};
				})
			);
		}
	}, [currentParallaxHistoryIndex, initialParallaxQuery, parallaxHistory]);

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

		useParallaxStore.getState().setApiTriggerType('filters');
		parallaxApi.triggerFilters(initialQuery, slicedHistory);
	};

	const onLabelsFilterChange = (values: Array<NodeLabelId>) => {
		filtersRef.current.labels = values;
		reRender();
	};

	const reRender = () => {
		setRenderKey(window.crypto.randomUUID());
	};

	const reset = () => {
		filtersRef.current = {
			properties: {},
			labels: []
		};

		applyPropertyFilters();
	};

	const labelsTitle = t('parallax_filters_labels_title');
	const propertiesTitle = t('parallax_filters_properties_title');
	const applyButtonTitle = t('parallax_filters_apply_button_title');
	const labelSelectPlaceholder = t('parallax_filters_select_placeholder');
	const labelSelectSearchPlaceholder = t('parallax_filters_select_search_placeholder');
	const labelSelectNoResultsText = t('parallax_filters_select_no_results_text');
	const labelSelectSelectAllLabel = t('parallax_filters_select_select_all_label');
	const noParallaxDataMessage = t('parallax_next_steps_no_parallax_data_message');
	const resetButtonTitle = t('parallax_filters_reset_button_title');

	return (
		<Loading isLoading={isParallaxLoading} renderChildrenWhileLoading={true}>
			<div id={id} className={rootElementClassName} data-testid={testId}>
				{!parallaxData ? (
					<p>
						<DBIcon icon="information_circle" /> {noParallaxDataMessage}
					</p>
				) : (
					<div className="parallax-filters__content">
						<h6>{labelsTitle}</h6>
						<DBCustomSelect
							options={labelsFilterDropdown}
							values={filtersRef.current.labels}
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
							{parallaxData.properties.map((propertyNode, index) => {
								const propertyId = getNodeSemanticIdOrId(propertyNode);
								const defaultValue =
									filtersRef.current.properties[propertyId] || '';

								const onChange = (event: ChangeEvent<HTMLInputElement>) => {
									if (event.target.value.trim()) {
										filtersRef.current.properties[propertyId] =
											event.target.value;
									} else {
										delete filtersRef.current.properties[propertyId];
									}

									reRender();
								};

								return (
									<div
										className="parallax-filters__filter"
										key={propertyId + '-' + index}
									>
										<ItemInfo item={propertyNode} />
										<DBInput
											value={defaultValue}
											label=""
											showLabel={false}
											placeholder=""
											validation="no-validation"
											onChange={onChange}
										/>
									</div>
								);
							})}
							<div className="parallax-filters__buttons">
								<DBButton variant="ghost" icon="cross" onClick={reset}>
									{resetButtonTitle}
								</DBButton>

								<DBButton
									onClick={applyPropertyFilters}
									variant="brand"
									disabled={isParallaxLoading || !parallaxData}
									icon="check"
								>
									{applyButtonTitle}
								</DBButton>
							</div>
						</div>
					</div>
				)}
			</div>
		</Loading>
	);
};
