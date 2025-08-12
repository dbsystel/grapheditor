import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { ItemFinder } from 'src/components/item-finder/ItemFinder';
import { Node } from 'src/models/node';
import { GraphEditorTypeSimplified } from 'src/utils/constants';
import { generateNode, nodeContainsSearchTerm } from 'src/utils/helpers/nodes';
import { useGetRelationsTypesNodes } from 'src/utils/hooks/useGetRelationsTypesNodes';
import { idFormatter } from 'src/utils/idFormatter';
import { RelationTypeItemFinderProps } from './RelationTypeItemFinder.interfaces';

export const RelationTypeItemFinder = ({
	invalidMessage,
	semantic,
	variant,
	onChange,
	onInput,
	label,
	placeholder,
	defaultSelectedOptions,
	defaultInputValue,
	inputValue,
	value,
	onEnterKey,
	id,
	className,
	testId
}: RelationTypeItemFinderProps) => {
	const [localInputValue, setLocalInputValue] = useState<string | undefined>(inputValue);
	const [relationTypes, setRelationTypes] = useState<Array<Node>>([]);
	const [filteredRelationTypes, setFilteredRelationTypes] = useState<Array<Node>>([]);
	const rootElementClassName = clsx('relation-type-item-finder', className);

	const { isLoading: isRelationsTypesLoading } = useGetRelationsTypesNodes({
		onSuccess: (nodes) => {
			setRelationTypes(nodes);
			setFilteredRelationTypes(nodes);
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
			const newOption = generateNode(
				idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_RELATION, searchTerm)
			);

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
			defaultSelectedOptions={defaultSelectedOptions}
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
		/>
	);
};
