import './SingleRelation.scss';
import 'src/assets/scss/single-item.scss';
import {
	DBAccordion,
	DBButton,
	DBIcon,
	DBNotification,
	DBSection,
	DBTooltip
} from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyToClipboard } from 'src/components/copy-to-clipboard/CopyToClipboard';
import { EditSaveBlock } from 'src/components/edit-save-block/EditSaveBlock';
import { ItemCenterButton } from 'src/components/item-center-button/ItemCenterButton';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { ItemProperties } from 'src/components/item-properties/ItemProperties';
import { ItemPropertiesHandle } from 'src/components/item-properties/ItemProperties.interfaces';
import { useItemsDrawerContext } from 'src/components/items-drawer/context/ItemsDrawerContext';
import { Loading } from 'src/components/loading/Loading';
import { MenuButton } from 'src/components/menu-button/MenuButton';
import { RelationTypeChanger } from 'src/components/relation-type-changer/RelationTypeChanger';
import { RelationTypeChangerHandle } from 'src/components/relation-type-changer/RelationTypeChanger.interfaces';
import { UnsavedChangedModalProps } from 'src/components/unsaved-changes-modal/UnsavedChangedModal.interfaces';
import { UnsavedChangesModal } from 'src/components/unsaved-changes-modal/UnsavedChangesModal';
import { MetaForMeta, Node } from 'src/models/node';
import { useGraphStore } from 'src/stores/graph';
import { useNotificationsStore } from 'src/stores/notifications';
import { useSearchStore } from 'src/stores/search';
import { api } from 'src/utils/api/api';
import { GraphEditorType } from 'src/utils/constants';
import { GRAPH_PRESENTATION_GRAPH } from 'src/utils/constants';
import { openInItemsDrawer } from 'src/utils/helpers/items';
import { getNodeByIdFromArrayOfNodes } from 'src/utils/helpers/nodes';
import { idFormatter } from 'src/utils/id-formatter';
import { SingleRelationEditMode, SingleRelationProps } from './SingleRelation.interfaces';

/**
 * This component contains the logic to present a detailed single relation view.
 */
export const SingleRelation = ({
	relation,
	variant,
	isEditable,
	shouldShowCenterButton,
	shouldShowOpenButton,
	id,
	className,
	testId
}: SingleRelationProps) => {
	const { t } = useTranslation();
	const { isInsideItemsDrawer } = useItemsDrawerContext();
	const [sourceAndTargetNodes, setSourceAndTargetNodes] = useState<Array<Node>>([]);
	const [isLoadingSourceAndTargetNodes, setIsLoadingSourceAndTargetNodes] = useState(true);
	const [isTypeMetaLoading, setIsTypeMetaLoading] = useState(false);
	const [currentEditMode, setCurrentEditMode] = useState<SingleRelationEditMode>('none');
	const [typeMeta, setTypeMeta] = useState<MetaForMeta>({});
	const [unsavedChangesData, setUnsavedChangesData] = useState<UnsavedChangedModalProps | null>(
		null
	);
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const sigma = useGraphStore((store) => store.sigma);
	const presentation = useSearchStore((store) => store.presentation);
	const isCenterButtonDisabled =
		presentation !== GRAPH_PRESENTATION_GRAPH || !sigma.getGraph().hasEdge(relation.id);
	const relationTypeHandleRef = useRef<RelationTypeChangerHandle>(null);
	const relationPropertiesHandleRef = useRef<ItemPropertiesHandle>(null);
	const rootElementClassName = clsx(
		'single-relation single-item',
		{
			'single-item--small': variant === 'small'
		},
		className
	);

	useEffect(() => {
		(async () => {
			setIsLoadingSourceAndTargetNodes(true);

			const response = await api.nodes.fetch.postNodesBulkFetch({
				nodeIds: [relation.source_id, relation.target_id]
			});
			const nodes = Object.values(response.data.nodes);
			const sourceNode = getNodeByIdFromArrayOfNodes(nodes, relation.source_id);
			const targetNode = getNodeByIdFromArrayOfNodes(nodes, relation.target_id);

			getMetaForMeta();

			if (sourceNode && targetNode) {
				// if relation is self-loop
				if (nodes.length === 1 && relation.source_id === relation.target_id) {
					const sourceTargetNode = nodes.at(0);

					if (sourceTargetNode) {
						setSourceAndTargetNodes([sourceTargetNode, sourceTargetNode]);
					}
				} else {
					setSourceAndTargetNodes(nodes);
				}
			} else {
				addNotification({
					title: t('notifications_failure_relation_fetch'),
					type: 'critical'
				});
			}

			setIsLoadingSourceAndTargetNodes(false);
		})();
	}, [relation]);

	const getMetaForMeta = () => {
		setIsTypeMetaLoading(true);

		api.metaForMeta.fetch
			.postMetaForMeta({
				ids: [relation.type],
				resultType: GraphEditorType.META_PROPERTY
			})
			.then((data) => {
				setTypeMeta(data.data.nodes);
			})
			.finally(() => {
				setIsTypeMetaLoading(false);
			});
	};

	const resetEditModeAndUnsavedChangesData = () => {
		setCurrentEditMode('none');
		setUnsavedChangesData(null);
	};

	const onTypeEditClick = () => {
		setCurrentEditMode('type');
	};

	const onTypeSaveClick = async () => {
		await relationTypeHandleRef.current?.handleSave();
		resetEditModeAndUnsavedChangesData();
	};

	const onTypeUndoClick = () => {
		if (relation.type !== relationTypeHandleRef.current?.type) {
			setUnsavedChangesData({
				unsavedSectionName: t('single_relation_type'),
				onCancelClick: undoType,
				onSaveClick: onTypeSaveClick
			});
		} else {
			undoType();
		}
	};

	const undoType = () => {
		relationTypeHandleRef.current?.handleUndo();
		resetEditModeAndUnsavedChangesData();
	};

	const onEditPropertiesClick = () => {
		setCurrentEditMode('properties');
	};

	const onUndoPropertiesClick = () => {
		if (relationPropertiesHandleRef.current?.validateProperties) {
			setUnsavedChangesData({
				unsavedSectionName: t('single_view_properties_title'),
				onCancelClick: undoProperties,
				onSaveClick: onSavePropertiesClick
			});
		} else {
			undoProperties();
		}
	};

	const onSavePropertiesClick = async () => {
		const saveOk = await relationPropertiesHandleRef.current?.handleSave();

		if (saveOk) {
			resetEditModeAndUnsavedChangesData();
		}
	};

	const undoProperties = () => {
		relationPropertiesHandleRef.current?.handleUndo();
		resetEditModeAndUnsavedChangesData();
	};

	const localOpenInItemsDrawer = () => {
		openInItemsDrawer(relation, isInsideItemsDrawer);
	};

	return (
		<DBSection id={id} className={rootElementClassName} data-testid={testId} spacing="none">
			<div className="single-item__header">
				<div className="single-item__title">
					<DBIcon icon="relation" />

					<p className="single-item__title-title">
						{relation.title}
						<DBTooltip className="db-tooltip-fix db-tooltip-fix--bottom">
							{t('single-relation-relation')}{' '}
							{idFormatter.parseIdToName(relation.title)}
						</DBTooltip>
					</p>

					<MenuButton
						optionsPlacement="bottom-start"
						buttonSize="small"
						options={[
							{
								title: t('single-relation-delete-item-button'),
								onClick: () =>
									api.relations.actions.deleteRelationsAndUpdateApplication([
										relation.id
									]),
								icon: 'bin'
							}
						]}
					/>

					<div className="single-item__buttons-right">
						{shouldShowCenterButton && (
							<ItemCenterButton item={relation} isDisabled={isCenterButtonDisabled} />
						)}

						{shouldShowOpenButton && (
							<DBButton size="small" variant="ghost" onClick={localOpenInItemsDrawer}>
								{t('single_item_open')}
							</DBButton>
						)}
					</div>
				</div>

				<div className="single-item__header-id">
					<p className="single-item__header-headline">ID</p>
					<p className="single-item__header-content">
						{idFormatter.formatId(relation.id)}
						<DBTooltip
							className="db-tooltip-fix db-tooltip-fix--bottom"
							width="auto"
							showArrow={false}
						>
							{relation.id}
						</DBTooltip>
					</p>

					<CopyToClipboard text={relation.id} />
				</div>
			</div>

			<DBAccordion behavior="multiple" initOpenIndex={[0, 1, 2, 3]} variant="card">
				<EditSaveBlock
					isEditable={false}
					isEditMode={false}
					headline={t('single-relation-relation')}
				>
					{isLoadingSourceAndTargetNodes === false && (
						<DBSection spacing="none" className="single-relation__relation">
							{sourceAndTargetNodes.length === 2 ? (
								<>
									<ItemInfo item={sourceAndTargetNodes[0]} />
									<DBIcon
										icon="arrow_right"
										className="single-relation__arrow-icon"
									/>
									<ItemInfo item={sourceAndTargetNodes[1]} />
								</>
							) : (
								<DBNotification
									semantic="critical"
									headline={t('single-relation-failure-notification-headline')}
								>
									{t('single-relation-failure-notification-content')}
								</DBNotification>
							)}
						</DBSection>
					)}
				</EditSaveBlock>

				<EditSaveBlock
					isEditable={isEditable}
					isEditMode={currentEditMode === 'type'}
					headline={t('single_relation_type')}
					onEditClick={onTypeEditClick}
					onSaveClick={onTypeSaveClick}
					onUndoClick={onTypeUndoClick}
				>
					<RelationTypeChanger
						handleRef={relationTypeHandleRef}
						relation={relation}
						isEditMode={currentEditMode === 'type'}
					/>
				</EditSaveBlock>

				<EditSaveBlock
					isEditable={isEditable}
					isEditMode={currentEditMode === 'properties'}
					headline={t('single_view_properties_title')}
					onEditClick={onEditPropertiesClick}
					onSaveClick={onSavePropertiesClick}
					onUndoClick={onUndoPropertiesClick}
				>
					<Loading
						isLoading={isTypeMetaLoading}
						wrapChildren={false}
						renderChildrenWhileLoading={true}
					>
						<ItemProperties
							item={relation}
							metaData={typeMeta}
							isEditMode={currentEditMode === 'properties'}
							handleRef={relationPropertiesHandleRef}
						/>
					</Loading>
				</EditSaveBlock>
			</DBAccordion>

			{unsavedChangesData && (
				<UnsavedChangesModal
					unsavedSectionName={unsavedChangesData.unsavedSectionName}
					onCancelClick={unsavedChangesData.onCancelClick}
					onSaveClick={unsavedChangesData.onSaveClick}
				/>
			)}
		</DBSection>
	);
};
