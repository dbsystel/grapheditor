import './RelationTypeItemFinder.scss';
import clsx from 'clsx';
import { FocusEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemFinder } from 'src/components/item-finder/ItemFinder';
import { Node } from 'src/models/node';
import { api } from 'src/utils/api/api';
import { GraphEditorTypeSimplified } from 'src/utils/constants';
import { generateNode, nodeContainsSearchTerm } from 'src/utils/helpers/nodes';
import { idFormatter } from 'src/utils/id-formatter';
import { RelationTypeItemFinderProps } from './RelationTypeItemFinder.interfaces';

/**
 * An autocomplete/select component for choosing a relation (meta-relation) type.
 * Options are fetched from the backend as suggestions, filtered by the optional "sourceId"/"targetId" and the current
 * search term. Results are split into model-derived types and other types, separated by a visual delimiter. The reset
 * (clear) behaviour is owned by the underlying "ItemFinder": setting "allowReset" renders a clear (X) button and, once a
 * selection is cleared, the optional "onReset" callback is invoked.
 */
export const RelationTypeItemFinder = ({
	invalidMessage,
	semantic,
	variant,
	onChange,
	onInput,
	label,
	placeholder,
	value,
	defaultValue,
	inputValue,
	defaultInputValue,
	onEnterKey,
	sourceId,
	targetId,
	id,
	className,
	testId,
	allowReset,
	resetTooltipText,
	shouldPreventAddingOptionOnEnter,
	shouldShowNoInputMatchTooltip = true,
	onReset
}: RelationTypeItemFinderProps) => {
	const { t } = useTranslation();
	const [localInputValue, setLocalInputValue] = useState<string | undefined>(inputValue);
	const [relationTypes, setRelationTypes] = useState<Array<Node>>([]);
	const [filteredRelationTypes, setFilteredRelationTypes] = useState<Array<Node>>([]);
	const [hasMoreOptions, setHasMoreOptions] = useState(false);
	const [optionDelimiterAfterIndexes, setOptionDelimiterAfterIndexes] = useState<Array<number>>(
		[]
	);
	const rootElementClassName = clsx('relation-type-item-finder', className);

	useEffect(() => {
		setLocalInputValue(inputValue);
	}, [inputValue]);

	const fetchRelationTypeSuggestions = async (text?: string) => {
		return api.meta.fetch
			.getRelationTypeSuggestions({
				text: text,
				sourceId: sourceId,
				targetId: targetId
			})
			.then((response) => {
				const numberOfModerDerivedTypes = response.data.modelDerived.length;
				const metaRelations = [...response.data.modelDerived, ...response.data.others];

				setOptionDelimiterAfterIndexes([numberOfModerDerivedTypes - 1]);
				setHasMoreOptions(response.data.hasMore);
				setRelationTypes(metaRelations);
				setFilteredRelationTypes(metaRelations);

				return metaRelations;
			});
	};

	const localOnInput = (searchTerm: string) => {
		setLocalInputValue(searchTerm);
		fetchRelationTypeSuggestions(searchTerm).then((metaRelations) => {
			if (onInput) {
				onInput(searchTerm, metaRelations);
			}
		});
	};

	const localOnInputFocus = (event: FocusEvent<HTMLInputElement>) => {
		fetchRelationTypeSuggestions(event.target.value);
	};

	const localOnEnterKey = (searchTerm: string) => {
		const localFilteredRelationTypes = getFilteredRelationTypes(searchTerm, true);
		const firstLocalFilteredRelationType = localFilteredRelationTypes.at(0);
		const matchingTypes = firstLocalFilteredRelationType
			? [firstLocalFilteredRelationType]
			: [];

		if (shouldPreventAddingOptionOnEnter) {
			if (onEnterKey) {
				onEnterKey(searchTerm, matchingTypes);
			}

			return;
		}

		// exact option match: use it as selected option
		if (firstLocalFilteredRelationType) {
			if (onEnterKey) {
				onEnterKey(searchTerm, matchingTypes);
			}
			setLocalInputValue(firstLocalFilteredRelationType.title);
		}
		// no exact match option: create a new node, add it to options list and
		// filtered options list
		else {
			const semanticId = idFormatter.formatSemanticId(
				GraphEditorTypeSimplified.META_RELATION,
				searchTerm
			);
			const newOption = generateNode(semanticId);

			setFilteredRelationTypes([...filteredRelationTypes, newOption]);
			setRelationTypes(() => {
				return [...relationTypes, newOption];
			});
			if (onEnterKey) {
				onEnterKey(searchTerm, [newOption]);
			}
		}
	};

	const getFilteredRelationTypes = (searchTerm: string, doExactTitleSearch?: boolean) => {
		return relationTypes.filter((relationType) => {
			return nodeContainsSearchTerm(relationType, searchTerm, doExactTitleSearch);
		});
	};

	return (
		<div className={rootElementClassName}>
			<ItemFinder
				id={id}
				testId={testId}
				value={value}
				defaultValue={defaultValue}
				inputValue={localInputValue}
				defaultInputValue={defaultInputValue}
				label={label}
				options={filteredRelationTypes}
				hasMoreOptions={hasMoreOptions}
				placeholder={placeholder}
				onChange={onChange}
				invalidMessage={invalidMessage}
				validMessage=""
				semantic={semantic}
				variant={variant}
				onInput={localOnInput}
				onInputFocus={localOnInputFocus}
				onEnterKey={localOnEnterKey}
				noInputMatchTooltip={t('item_finder_confirm_input_tooltip')}
				shouldShowNoInputMatchTooltip={shouldShowNoInputMatchTooltip}
				optionDelimiterAfterIndexes={optionDelimiterAfterIndexes}
				allowReset={allowReset}
				resetTooltipText={resetTooltipText}
				onReset={onReset}
			/>
		</div>
	);
};
