import './RelationTypeChanger.scss';
import { DBTag } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useCallback, useImperativeHandle, useState } from 'react';
import { RelationTypeItemFinder } from 'src/components/relation-type-item-finder/RelationTypeItemFinder';
import { Node } from 'src/models/node';
import { useItemOverviewPopoverStore } from 'src/stores/item-overview-popover';
import { api } from 'src/utils/api/api';
import { getNodeSemanticIdOrId } from 'src/utils/helpers/nodes';
import { useGetNode } from 'src/utils/hooks/useGetNode';
import { RelationTypeChangerProps } from './RelationTypeChanger.interfaces';

export const RelationTypeChanger = ({
	relation,
	id,
	className,
	testId,
	isEditMode,
	handleRef
}: RelationTypeChangerProps) => {
	const [selectedType, setSelectedType] = useState<Node | null>(null);
	const [originalType, setOriginalType] = useState<Node | null>(null);
	const rootElementClassName = clsx('relation-type-changer', className);

	useGetNode({
		nodeId: relation.type,
		onSuccess: (response) => {
			setSelectedType(response.data);
			setOriginalType(response.data);
		}
	});

	const onRefChange = useCallback(
		(element: HTMLDivElement | null) => {
			if (element && selectedType) {
				useItemOverviewPopoverStore
					.getState()
					.registerTriggerElement({ triggerElement: element, item: selectedType });
			}
		},
		[selectedType]
	);

	const onTypeChange = (option: Node) => {
		setSelectedType(option);
	};

	const onEnterKey = (searchTerm: string, matchingTypes: Array<Node>) => {
		if (matchingTypes.length) {
			onTypeChange(matchingTypes[0]);
		}
	};

	const handleUndo = () => {
		setSelectedType(originalType);
	};

	const handleSave = async () => {
		if (selectedType) {
			const patchObject = {
				id: relation.id,
				type: selectedType.id
			};

			await api.relations.actions.patchRelationsAndUpdateApplication([patchObject]);
			setOriginalType(selectedType);
		}
	};

	useImperativeHandle(handleRef, () => ({
		handleSave,
		handleUndo,
		type: selectedType ? getNodeSemanticIdOrId(selectedType) : ''
	}));

	if (!selectedType) {
		return;
	}

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{!isEditMode ? (
				<DBTag ref={onRefChange}>{selectedType.title}</DBTag>
			) : (
				<div className="relation-type-changer__relation-change">
					<div className="relation-type-changer__relation-finder">
						<RelationTypeItemFinder
							label=""
							inputValue={selectedType.title}
							value={selectedType}
							onChange={onTypeChange}
							onEnterKey={onEnterKey}
						/>
					</div>
				</div>
			)}
		</div>
	);
};
