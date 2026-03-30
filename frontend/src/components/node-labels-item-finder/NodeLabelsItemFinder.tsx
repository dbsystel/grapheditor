import './NodeLabelsItemFinder.scss';
import { DBCheckbox, DBIcon, DBTag, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemFinder } from 'src/components/item-finder/ItemFinder';
import { Node } from 'src/models/node';
import { useItemOverviewPopoverStore } from 'src/stores/item-overview-popover';
import { api } from 'src/utils/api/api';
import { GraphEditorTypeSimplified } from 'src/utils/constants';
import { compareTwoStringsForSorting } from 'src/utils/helpers/general';
import {
	generateNode,
	getNodeSemanticIdOrId,
	nodeContainsSearchTerm
} from 'src/utils/helpers/nodes';
import { useGetNodesLabelsNodes } from 'src/utils/hooks/useGetNodesLabelsNodes';
import { idFormatter } from 'src/utils/id-formatter';
import {
	NodeLabelsItemFinderProps,
	NodeLabelsItemFinderTagProps
} from './NodeLabelsItemFinder.interfaces';

export const NodeLabelsItemFinder = (props: NodeLabelsItemFinderProps) => {
	const { id, className, testId, showTooltipOnHover = true, onTagsSelected, handleRef } = props;
	const { t } = useTranslation();
	// labels used by the ItemFinder component as options
	const [labelOptions, setLabelOptions] = useState<Array<Node>>([]);
	// labels to be sent to backend
	const [value, setValue] = useState<Array<Node> | undefined>(props.value);
	const [labelInputValue, setLabelInputValue] = useState('');
	// all labels (used for filtering options for the ItemFinder component)
	const allLabels = useRef<Array<Node>>([]);
	const rootElementClassName = clsx('node-labels-item-finder', className);
	const label = props.label || t('create_node_label');
	const timeoutRef = useRef(0);
	const [newlyAddedTags, setNewlyAddedTags] = useState<Array<string>>([]);
	const [selectedTagIds, setSelectedTagIds] = useState<Array<string>>([]);
	const [originalValue, setOriginalValue] = useState<Array<Node> | undefined>(undefined);
	const [highlightedTagIds, setHighlightedTagIds] = useState<Array<string>>([]);
	const sortedLabels = useMemo(() => {
		return value?.slice().toSorted((a, b) => {
			const aTitle = idFormatter.parseIdToName(a.title);
			const bTitle = idFormatter.parseIdToName(b.title);

			return compareTwoStringsForSorting(aTitle, bTitle);
		});
	}, [value]);
	const indeterminateCheckboxRef = useRef<HTMLInputElement>(null);
	const allTagIds = sortedLabels?.map((label) => label.id) || [];
	const isCheckboxChecked = selectedTagIds.length === allTagIds.length && allTagIds.length > 0;
	const isCheckboxIndeterminate =
		selectedTagIds.length > 0 && selectedTagIds.length < allTagIds.length;
	const isDefaultMode = props.mode === 'default';
	const isEditMode = props.mode === 'edit';
	const editLabels = isEditMode && !!props.isEditMode;
	const isEditModeActive = props.mode === 'edit' && editLabels;

	const { isLoading: isLabelsLoading, reFetch: reFetchLabels } = useGetNodesLabelsNodes({
		executeImmediately: false,
		onSuccess: (response) => {
			const responseNodes = Object.values(response.data.nodes);

			allLabels.current = responseNodes;
			setLabelOptions(responseNodes);
		}
	});

	// TODO "labels" seem to be one step behind when "handleRef" is used in "onChange"
	useImperativeHandle(handleRef, () => ({
		handleSave,
		handleUndo,
		setHighlightedTagIds: setHighlightedTagIds,
		labels: getNodesSemanticIdOrId(value || [])
	}));

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

	useEffect(() => {
		if (!isEditModeActive && props.value) {
			setOriginalValue(props.value);
		}
	}, [props.value, isEditModeActive]);

	const getNodesSemanticIdOrId = (nodes: Array<Node>) => {
		return nodes.map((node) => getNodeSemanticIdOrId(node));
	};

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
		if (handleRef && handleRef.current) {
			handleRef.current.labels = getNodesSemanticIdOrId(selectedItems);
		}

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

	const handleSave = async () => {
		if (isEditMode) {
			const patchObject = {
				id: props.node.id,
				labels: (value || []).map((label) => label.id)
			};

			await api.nodes.actions.patchNodesAndUpdateApplication([patchObject]);

			setNewlyAddedTags([]);
			setOriginalValue(value);
		}
	};

	const handleUndo = () => {
		setValue(originalValue);
		setNewlyAddedTags([]);
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
								const isHighlighted = highlightedTagIds.includes(label.id);
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
										onLabelChange={onLabelChange}
										value={value}
										onTagSelect={handleTagSelect}
										tooltipLabel={label}
										showTooltipOnHover={showTooltipOnHover}
									/>
								);
							})}
					</div>
				)}

				{!!props.isSelectAllDisabled === false && (
					<div className="node-labels-item-finder__head">
						<DBCheckbox
							onClick={handleCheckboxClick}
							ref={indeterminateCheckboxRef}
							checked={isCheckboxChecked}
						/>

						<DBTooltip
							width="fixed"
							showArrow={false}
							className="db-tooltip-fix db-tooltip-fix--bottom-end"
						>
							{isCheckboxChecked
								? t('node-labels-item-finder-checkbox-uncheck_all_labels')
								: t('node-labels-item-finder-checkbox-select_all_labels')}
						</DBTooltip>
					</div>
				)}
			</div>

			{(isDefaultMode || props.isEditMode) && (
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

const Tag = ({
	isNewlyAdded,
	isSelected,
	editLabels,
	isHighlighted,
	label,
	onLabelChange,
	value,
	onTagSelect,
	tooltipLabel,
	shouldRenderWarningIcon,
	showTooltipOnHover
}: NodeLabelsItemFinderTagProps) => {
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
		if (element && tooltipLabel && showTooltipOnHover) {
			useItemOverviewPopoverStore
				.getState()
				.registerTriggerElement({ triggerElement: element, item: tooltipLabel });
		}
	}, []);

	const onRemove = () => {
		if (editLabels) {
			onLabelChange(
				label,
				false,
				value.filter((v) => v.id !== label.id)
			);
		}
	};

	const onCheckboxClick = () => {
		onTagSelect(label.id);
	};

	return (
		<DBTag
			className={rootElementClassName}
			showCheckState={false}
			data-density="functional"
			ref={onRefChange}
			behavior={editLabels ? 'removable' : undefined}
			onRemove={onRemove}
			emphasis={isSelected ? 'strong' : undefined}
		>
			<DBCheckbox onClick={onCheckboxClick} checked={isSelected}>
				{shouldRenderWarningIcon && <DBIcon icon="exclamation_mark_circle" />}

				{idFormatter.parseIdToName(label.title)}
			</DBCheckbox>
		</DBTag>
	);
};
