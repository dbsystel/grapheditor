import './NodeLabelsItemFinder.scss';
import { DBButton, DBCheckbox, DBIcon, DBTag, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemFinder } from 'src/components/item-finder/ItemFinder';
import { ItemOverviewTooltip } from 'src/components/item-overview-tooltip/ItemOverviewTooltip';
import { Node } from 'src/models/node';
import { useItemsStore } from 'src/stores/items';
import { nodesApi } from 'src/utils/api/nodes';
import { GraphEditorTypeSimplified } from 'src/utils/constants';
import { ITEM_OVERVIEW_TIMEOUT_MILLISECONDS } from 'src/utils/constants';
import { generateNode, nodeContainsSearchTerm } from 'src/utils/helpers/nodes';
import { useGetNodesLabelsNodes } from 'src/utils/hooks/useGetNodesLabelsNodes';
import { idFormatter } from 'src/utils/idFormatter';
import {
	NodeLabelsItemFinderProps,
	NodeLabelsItemFinderTagProps
} from './NodeLabelsItemFinder.interfaces';

export const NodeLabelsItemFinder = (props: NodeLabelsItemFinderProps) => {
	const { id, className, testId, showTooltipOnHover = true, onTagsSelected } = props;
	const { t } = useTranslation();
	// labels used by the ItemFinder component as options
	const [labelOptions, setLabelOptions] = useState<Array<Node>>([]);
	// labels to be sent to backend
	const [value, setValue] = useState<Array<Node> | undefined>(props.value);
	const [labelInputValue, setLabelInputValue] = useState('');
	// all labels (used for filtering options for the ItemFinder component)
	const allLabels = useRef<Array<Node>>([]);
	const [editLabels, setEditLabels] = useState(false);
	const setNode = useItemsStore((store) => store.setNode);
	const isDefaultMode = props.mode === 'default';
	const isEditMode = props.mode === 'edit';
	const isEditModeActive = props.mode === 'edit' && editLabels;
	const rootElementClassName = clsx('node-labels-item-finder', className);
	const label = props.label || t('create_node_label');
	const [isAddButtonClicked, setIsAddButtonClicked] = useState<boolean>(false);
	const [tooltipLabel, setTooltipLabel] = useState<Node | null>(null);
	const timeoutRef = useRef(0);
	const [newlyAddedTags, setNewlyAddedTags] = useState<Array<string>>([]);
	const [selectedTagIds, setSelectedTagIds] = useState<Array<string>>([]);
	const sortedLabels = useMemo(() => {
		return value?.slice().sort((a, b) => a.title.localeCompare(b.title));
	}, [value]);
	const allTagIds = sortedLabels?.map((label) => label.id) || [];
	const isCheckboxChecked = selectedTagIds.length === allTagIds.length && allTagIds.length > 0;
	const isCheckboxIndeterminate =
		selectedTagIds.length > 0 && selectedTagIds.length < allTagIds.length;
	const indeterminateCheckboxRef = useRef<HTMLInputElement>(null);

	const { isLoading: isLabelsLoading, reFetch: reFetchLabels } = useGetNodesLabelsNodes({
		executeImmediately: false,
		onSuccess: (data) => {
			data.forEach((node) => {
				setNode(node, true);
			});

			allLabels.current = data;
			setLabelOptions(data);
		}
	});

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				window.clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	useEffect(() => {
		setValue(props.value);
	}, [props.value]);

	useEffect(() => {
		if (isDefaultMode || isEditModeActive) {
			reFetchLabels();
		}
	}, [isDefaultMode, isEditModeActive]);

	useEffect(() => {
		if (indeterminateCheckboxRef.current) {
			indeterminateCheckboxRef.current.indeterminate = isCheckboxIndeterminate;
		}
	}, [isCheckboxIndeterminate]);

	/**
	 * Function executed on the ItemFinder labels search.
	 */
	const onLabelSearch = (searchTerm: string) => {
		setLabelInputValue(searchTerm);

		setLabelOptions(
			allLabels.current.filter((label) => {
				return nodeContainsSearchTerm(label, searchTerm);
			})
		);
	};

	/**
	 * Function executed on the ItemFinder options click.
	 */
	const onLabelChange = (item: Node, isItemSelected: boolean, selectedItems: Array<Node>) => {
		setValue(selectedItems);

		if (isItemSelected && !newlyAddedTags.includes(item.id)) {
			setNewlyAddedTags((prev) => [...prev, item.id]);
		}

		if (props.onChange) {
			props.onChange(item, isItemSelected, selectedItems);
		}
	};

	const onLabelEnterKey = (searchTerm: string) => {
		// check if the search term matches on of the label options and use it if so
		const optionMatch = labelOptions.find((option) => {
			return option.title === searchTerm;
		});

		const newLabel = optionMatch
			? optionMatch
			: generateNode(
					idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_LABEL, searchTerm)
				);

		if (!optionMatch) {
			allLabels.current.push(newLabel);
		}

		const newLabels = [...(value || []), newLabel];

		onLabelChange(newLabel, true, newLabels);
		setLabelInputValue('');
		setLabelOptions(allLabels.current);

		setNewlyAddedTags((prev) => [...prev, newLabel.id]);
	};

	const onSave = async () => {
		if (isEditMode) {
			const patchObject = {
				id: props.node.id,
				labels: (value || []).map((label) => label.id)
			};

			await nodesApi.patchNodesAndUpdateApplication([patchObject]);

			setEditLabels(false);
			setIsAddButtonClicked(false);

			setNewlyAddedTags([]);
		}
	};

	const onEdit = () => {
		setEditLabels(true);
	};

	const onAddButtonClick = () => {
		setIsAddButtonClicked(true);
	};

	const onMouseEnter = (label: Node) => {
		if (showTooltipOnHover) {
			if (timeoutRef.current) {
				window.clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = window.setTimeout(() => {
				setTooltipLabel(label);
			}, ITEM_OVERVIEW_TIMEOUT_MILLISECONDS);
		}
	};

	const onMouseLeave = () => {
		if (showTooltipOnHover) {
			if (timeoutRef.current) {
				window.clearTimeout(timeoutRef.current);
			}
			setTooltipLabel(null);
		}
	};

	const handleTagSelect = (tagId: string) => {
		setSelectedTagIds((prev) => {
			const newSelectedTagIds = prev.includes(tagId)
				? prev.filter((id) => id !== tagId)
				: [...prev, tagId];

			const updatedTagLabelObjects =
				sortedLabels &&
				sortedLabels.filter((label) => newSelectedTagIds.includes(label.id));

			if (!isEditModeActive && onTagsSelected) {
				onTagsSelected(updatedTagLabelObjects || []);
			}

			return newSelectedTagIds;
		});
	};

	const handleCheckboxClick = () => {
		const newSelectedTagIds = isCheckboxChecked ? [] : allTagIds;

		const updatedTagLabelObjects =
			sortedLabels && sortedLabels.filter((label) => newSelectedTagIds.includes(label.id));

		setSelectedTagIds(newSelectedTagIds);

		if (!isEditModeActive && onTagsSelected) {
			onTagsSelected(updatedTagLabelObjects || []);
		}
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<div className="node-labels-item-finder__tags">
				{value && (
					<div className="node-labels-item-finder__labels" data-density="functional">
						{sortedLabels &&
							sortedLabels.map((label) => {
								const isNewlyAdded = newlyAddedTags.includes(label.id);
								const isSelected = selectedTagIds.includes(label.id);
								const isHighlighted = !!props.highlightedTagIds?.includes(label.id);
								const hoveredTooltipLabel =
									tooltipLabel && tooltipLabel.id === label.id ? label : null;
								const shouldRenderWarningIcon = props.markTagIdsAsWarning?.includes(
									label.id
								);

								return (
									<Tag
										key={label.id}
										label={label}
										isNewlyAdded={isNewlyAdded}
										isSelected={isSelected}
										editLabels={editLabels}
										isHighlighted={isHighlighted}
										shouldRenderWarningIcon={shouldRenderWarningIcon}
										onMouseEnter={onMouseEnter}
										onMouseLeave={onMouseLeave}
										onLabelChange={onLabelChange}
										value={value}
										onTagSelect={handleTagSelect}
										tooltipLabel={hoveredTooltipLabel}
									/>
								);
							})}
						{isEditModeActive && (
							<div>
								<DBButton
									className="node-labels-item-finder__add-button"
									variant="ghost"
									noText
									icon="plus"
									size="small"
									onClick={onAddButtonClick}
								/>
							</div>
						)}
					</div>
				)}

				<div className="node-labels-item-finder__head">
					{isEditMode && !isEditModeActive && (
						<div className="node-labels-item-finder__edit-button-and-checkbox">
							<DBButton
								className="node-labels-item-finder__edit-button"
								icon="pen"
								type="button"
								size="small"
								noText
								variant="ghost"
								title={t('edit')}
								onClick={onEdit}
							/>

							<DBCheckbox
								id="node-labels-item-finder__check"
								onClick={handleCheckboxClick}
								ref={indeterminateCheckboxRef}
								checked={isCheckboxChecked}
							/>

							<DBTooltip
								id="node-labels-item-finder__check"
								width="fixed"
								placement="left-end"
								showArrow={false}
							>
								{isCheckboxChecked
									? t('node-labels-item-finder-checkbox-uncheck_all_labels')
									: t('node-labels-item-finder-checkbox-select_all_labels')}
							</DBTooltip>
						</div>
					)}

					{isEditModeActive && <SaveButton onSave={onSave} />}
				</div>
			</div>

			{(isDefaultMode || isAddButtonClicked) && (
				<ItemFinder
					className="node-labels-item-finder__itemfinder"
					placeholder={props.placeholder}
					label={label}
					variant={props.variant}
					options={labelOptions}
					value={value}
					defaultSelectedOptions={props.defaultSelectedOptions}
					inputValue={labelInputValue}
					onInput={onLabelSearch}
					onEnterKey={onLabelEnterKey}
					onChange={onLabelChange}
					searchTimeoutMilliseconds={0}
					isMultiselect={true}
					isDisabled={isLabelsLoading}
					invalidMessage=""
					validMessage=""
					hideBadges={true}
				/>
			)}
		</div>
	);
};

const SaveButton = ({ onSave }: { onSave: () => void }) => {
	const { t } = useTranslation();

	return (
		<DBButton
			className="db-bg-successful"
			icon="check"
			type="button"
			variant="brand"
			noText
			size="small"
			title={t('save')}
			onClick={onSave}
		/>
	);
};

const Tag = ({
	isNewlyAdded,
	isSelected,
	editLabels,
	isHighlighted,
	label,
	onMouseEnter,
	onMouseLeave,
	onLabelChange,
	value,
	onTagSelect,
	tooltipLabel,
	shouldRenderWarningIcon
}: NodeLabelsItemFinderTagProps) => {
	const [ref, setRef] = useState<HTMLDivElement | null>(null);
	const rootElementClassName = clsx(
		isHighlighted
			? 'node-labels-item-finder__highlighted-border'
			: 'node-labels-item-finder__normal-border',
		{
			'node-labels-item-finder__newly-added': isNewlyAdded,
			'node-labels-item-finder__tags-edit-mode': editLabels
		}
	);

	const onRefChange = useCallback((element: HTMLDivElement | null) => {
		setRef(element);
	}, []);

	return (
		<>
			<DBTag
				className={rootElementClassName}
				showCheckState={false}
				data-density="functional"
				onMouseEnter={() => onMouseEnter(label)}
				onMouseLeave={onMouseLeave}
				ref={onRefChange}
				behavior={editLabels ? 'removable' : undefined}
				/* TODO https://github.com/db-ux-design-system/core-web/issues/3837
				   check and fix the warning shown in the browser console
				   (Warning: Unknown event handler property `onRemove`. It will be ignored.)
				*/
				onRemove={
					editLabels
						? () =>
								onLabelChange(
									label,
									false,
									value.filter((v) => v.id !== label.id)
								)
						: undefined
				}
				emphasis={isSelected ? 'strong' : undefined}
			>
				<DBCheckbox onClick={() => onTagSelect(label.id)} checked={isSelected}>
					{shouldRenderWarningIcon && <DBIcon icon="exclamation_mark_circle" />}

					{label.title}

					{tooltipLabel && <ItemOverviewTooltip item={tooltipLabel} tooltipRef={ref} />}
				</DBCheckbox>
			</DBTag>
		</>
	);
};
