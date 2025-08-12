import './RelationTypeChanger.scss';
import { DBButton, DBTag } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemOverviewTooltip } from 'src/components/item-overview-tooltip/ItemOverviewTooltip';
import { RelationTypeItemFinder } from 'src/components/relation-type-item-finder/RelationTypeItemFinder';
import { Node } from 'src/models/node';
import { relationsApi } from 'src/utils/api/relations';
import { ITEM_OVERVIEW_TIMEOUT_MILLISECONDS } from 'src/utils/constants';
import { useGetNode } from 'src/utils/hooks/useGetNode';
import { RelationTypeChangerProps } from './RelationTypeChanger.interfaces';

export const RelationTypeChanger = ({
	relation,
	showTooltipOnHover = true,
	id,
	className,
	testId
}: RelationTypeChangerProps) => {
	const { t } = useTranslation();
	const [isEditing, setIsEditing] = useState(false);
	const [relationTypeNode, setRelationTypeNode] = useState<Node | null>(null);
	const [selectedType, setSelectedType] = useState<Node | null>(null);
	const [originalType, setOriginalType] = useState<Node | null>(null);
	const [hasPendingChange, setHasPendingChange] = useState<boolean>(false);
	const [renderTooltip, setRenderTooltip] = useState<boolean>(false);
	const [ref, setRef] = useState<HTMLDivElement | null>(null);
	const timeoutRef = useRef(0);
	const rootElementClassName = clsx('relation-type-changer', className);

	useGetNode({
		nodeId: relation.type,
		onSuccess: (response) => {
			setRelationTypeNode(response.data);
		}
	});

	const onRefChange = useCallback((element: HTMLDivElement | null) => {
		setRef(element);
	}, []);

	const onTypeChange = (option: Node) => {
		setSelectedType(option);
		setHasPendingChange(true);
	};

	const onEnterKey = (searchTerm: string, matchingTypes: Array<Node>) => {
		if (matchingTypes.length) {
			onTypeChange(matchingTypes[0]);
		}
	};

	const startEditing = () => {
		setIsEditing(true);
		setSelectedType(relationTypeNode);
		setOriginalType(relationTypeNode);
	};

	const handleUndo = () => {
		if (originalType) {
			setSelectedType(originalType);
			setHasPendingChange(false);
		}
	};

	const handleSave = () => {
		if (selectedType) {
			const patchObject = {
				id: relation.id,
				type: selectedType.id
			};

			relationsApi.patchRelationsAndUpdateApplication([patchObject]);
			setRelationTypeNode(selectedType); // Update the main state
		}
		setHasPendingChange(false);
		setIsEditing(false);
	};

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

	if (!relationTypeNode) {
		return;
	}

	return (
		<div id={id} className={rootElementClassName} ref={onRefChange} data-testid={testId}>
			{!isEditing ? (
				<div className="relation-type-changer__tag-edit">
					<DBTag onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
						{relationTypeNode.title}

						{renderTooltip && (
							<ItemOverviewTooltip item={relationTypeNode} tooltipRef={ref} />
						)}
					</DBTag>

					<DBButton
						icon="pen"
						type="button"
						size="small"
						noText
						variant="ghost"
						title={t('edit')}
						onClick={startEditing}
					/>
				</div>
			) : (
				<div className="relation-type-changer__relation-change">
					<div className="relation-type-changer__relation-finder">
						<RelationTypeItemFinder
							label=""
							inputValue={selectedType?.title || relationTypeNode?.title}
							value={selectedType ? [selectedType] : [relationTypeNode]}
							onChange={onTypeChange}
							onEnterKey={onEnterKey}
						/>
						{hasPendingChange && (
							<DBButton
								type="button"
								size="small"
								variant="filled"
								className="relation-type-changer__back-button"
								onClick={handleUndo}
							>
								{t('relation-type-changer-undo-change-button')}
							</DBButton>
						)}
					</div>

					<DBButton
						className="db-bg-successful"
						icon="check"
						type="button"
						variant="brand"
						noText
						size="small"
						title={t('save')}
						onClick={handleSave}
					/>
				</div>
			)}
		</div>
	);
};
