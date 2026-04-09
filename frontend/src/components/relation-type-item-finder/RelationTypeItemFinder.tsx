import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemFinder } from 'src/components/item-finder/ItemFinder';
import { Node } from 'src/models/node';
import { GraphEditorTypeSimplified } from 'src/utils/constants';
import { generateNode, nodeContainsSearchTerm } from 'src/utils/helpers/nodes';
import { useGetRelationsTypesNodes } from 'src/utils/hooks/useGetRelationsTypesNodes';
import { idFormatter } from 'src/utils/id-formatter';
import { RelationTypeItemFinderProps } from './RelationTypeItemFinder.interfaces';

export const RelationTypeItemFinder = ({
	invalidMessage,
	semantic,
	variant,
	onChange,
	onInput,
	label,
	placeholder,
	defaultValue,
	defaultInputValue,
	inputValue,
	value,
	onEnterKey,
	id,
	className,
	testId,
	additionalOptions
}: RelationTypeItemFinderProps) => {
	const { t } = useTranslation();
	const [localInputValue, setLocalInputValue] = useState<string | undefined>(inputValue);
	const [relationTypes, setRelationTypes] = useState<Array<Node>>([]);
	const [filteredRelationTypes, setFilteredRelationTypes] = useState<Array<Node>>([]);
	const rootElementClassName = clsx('relation-type-item-finder', className);

	const { isLoading: isRelationsTypesLoading } = useGetRelationsTypesNodes({
		onSuccess: (response) => {
			const nodes = Object.values(response.data.nodes);
			const extraOptions = additionalOptions ? additionalOptions : [];
			const options = [...extraOptions, ...nodes];

			setRelationTypes(options);
			setFilteredRelationTypes(options);
		}
	});

	useEffect(() => {
		setLocalInputValue(inputValue);
	}, [inputValue]);

	const localOnInput = (searchTerm: string) => {
		const filteredRelationTypes = getFilteredRelationTypes(searchTerm);

		setFilteredRelationTypes(filteredRelationTypes);

		if (onInput) {
			onInput(searchTerm, filteredRelationTypes);
		}
	};

	const localOnEnterKey = (searchTerm: string) => {
		const localFilteredRelationTypes = getFilteredRelationTypes(searchTerm, true);

		// exact option match: use it as selected option
		if (localFilteredRelationTypes.length) {
			if (onEnterKey) {
				onEnterKey(searchTerm, [localFilteredRelationTypes[0]]);
			}
			setLocalInputValue(localFilteredRelationTypes[0].title);
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
		<ItemFinder
			id={id}
			className={rootElementClassName}
			testId={testId}
			value={value}
			inputValue={localInputValue}
			label={label}
			defaultInputValue={defaultInputValue}
			defaultValue={defaultValue}
			options={filteredRelationTypes}
			placeholder={placeholder}
			onChange={onChange}
			invalidMessage={invalidMessage}
			validMessage=""
			semantic={semantic}
			isDisabled={isRelationsTypesLoading}
			variant={variant}
			onInput={localOnInput}
			onEnterKey={localOnEnterKey}
			noInputMatchTooltip={t('item_finder_confirm_input_tooltip')}
		/>
	);
};
