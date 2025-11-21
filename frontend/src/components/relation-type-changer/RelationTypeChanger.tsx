import './RelationTypeChanger.scss';
import { DBTag } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useCallback, useImperativeHandle, useRef, useState } from 'react';
import { ItemOverviewPopover } from 'src/components/item-overview-popover/ItemOverviewPopover';
import { RelationTypeItemFinder } from 'src/components/relation-type-item-finder/RelationTypeItemFinder';
import { Node } from 'src/models/node';
import { relationsApi } from 'src/utils/api/relations';
import { ITEM_OVERVIEW_TIMEOUT_MILLISECONDS } from 'src/utils/constants';
import { getNodeSemanticIdOrId } from 'src/utils/helpers/nodes';
import { useGetNode } from 'src/utils/hooks/useGetNode';
import { RelationTypeChangerProps } from './RelationTypeChanger.interfaces';

export const RelationTypeChanger = ({
	relation,
	showTooltipOnHover = true,
	id,
	className,
	testId,
	isEditMode,
	handleRef
}: RelationTypeChangerProps) => {
	const [selectedType, setSelectedType] = useState<Node | null>(null);
	const [originalType, setOriginalType] = useState<Node | null>(null);
	const [renderTooltip, setRenderTooltip] = useState<boolean>(false);
	const [tooltipRef, setTooltipRef] = useState<HTMLDivElement | null>(null);
	const timeoutRef = useRef(0);
	const rootElementClassName = clsx('relation-type-changer', className);

	useGetNode({
		nodeId: relation.type,
		onSuccess: (response) => {
			setSelectedType(response.data);
			setOriginalType(response.data);
		}
	});

	const onRefChange = useCallback((element: HTMLDivElement | null) => {
		setTooltipRef(element);
	}, []);

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

			await relationsApi.patchRelationsAndUpdateApplication([patchObject]);
			setOriginalType(selectedType);
		}
	};

	useImperativeHandle(handleRef, () => ({
		handleSave,
		handleUndo,
		type: selectedType ? getNodeSemanticIdOrId(selectedType) : ''
	}));

	const onMouseEnter = () => {
		if (showTooltipOnHover) {
			if (timeoutRef.current) {
				window.clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = window.setTimeout(() => {
				setRenderTooltip(true);
			}, ITEM_OVERVIEW_TIMEOUT_MILLISECONDS);
		}
	};

	const onMouseLeave = () => {
		if (showTooltipOnHover) {
			if (timeoutRef.current) {
				window.clearTimeout(timeoutRef.current);
			}

			setRenderTooltip(false);
		}
	};

	if (!selectedType) {
		return;
	}

	return (
		<div id={id} className={rootElementClassName} ref={onRefChange} data-testid={testId}>
			{!isEditMode ? (
				<DBTag onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
					{selectedType.title}

					{renderTooltip && (
						<ItemOverviewPopover item={selectedType} popoverRef={tooltipRef} />
					)}
				</DBTag>
			) : (
				<div className="relation-type-changer__relation-change">
					<div className="relation-type-changer__relation-finder">
						<RelationTypeItemFinder
							label=""
							inputValue={selectedType.title}
							value={[selectedType]}
							onChange={onTypeChange}
							onEnterKey={onEnterKey}
						/>
					</div>
				</div>
			)}
		</div>
	);
};
