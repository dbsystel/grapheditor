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
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { MetaForMeta, Node } from 'src/models/node';
import { useConfirmationModalStore } from 'src/stores/confirmation-modal';
import { useGraphStore } from 'src/stores/graph';
import { useNotificationsStore } from 'src/stores/notifications';
import { useSearchStore } from 'src/stores/search';
import { SettingsSectionsLocation, useSettingsStore } from 'src/stores/settings';
import { useUnsavedChangesStore } from 'src/stores/unsaved-changes';
import { api } from 'src/utils/api/api';
import { GraphEditorType } from 'src/utils/constants';
import { GRAPH_PRESENTATION_GRAPH } from 'src/utils/constants';
import { getDefaultUnsavedChangesHandle, openInItemsDrawer } from 'src/utils/helpers/items';
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
	const toggleDefaultOpenSection = useSettingsStore((store) => store.toggleDefaultOpenSection);
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const sigma = useGraphStore((store) => store.sigma);
	const presentation = useSearchStore((store) => store.presentation);
	const isCenterButtonDisabled =
		presentation !== GRAPH_PRESENTATION_GRAPH || !sigma.getGraph().hasEdge(relation.id);
	const relationTypeHandleRef = useRef<RelationTypeChangerHandle>(
		getDefaultUnsavedChangesHandle('relation-type', 'single_relation_type')
	);
	const relationPropertiesHandleRef = useRef<ItemPropertiesHandle>(
		getDefaultUnsavedChangesHandle('properties', 'single_view_properties_title')
	);
	const rootElementClassName = clsx(
		'single-relation single-item',
		{
			'single-item--small': variant === 'small'
		},
		className
	);
	const sectionsLocation: SettingsSectionsLocation = isInsideItemsDrawer
		? 'itemsDrawer'
		: 'mouseover';

	const initOpenIndexes = useMemo(() => {
		return useSettingsStore
			.getState()
			.getItemsDrawerDefaultOpenSectionsIndexes(sectionsLocation, [
				'relation-relation',
				'relation-type',
				'relation-properties'
			]);
	}, [relation]);

	useEffect(() => {
		if (isInsideItemsDrawer) {
			useUnsavedChangesStore.getState().addHandle(relationPropertiesHandleRef.current);
			useUnsavedChangesStore.getState().addHandle(relationTypeHandleRef.current);
		}

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

		return () => {
			if (isInsideItemsDrawer) {
				useUnsavedChangesStore.getState().reset();
			}
		};
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

	const resetEditModeAndConfirmation = () => {
		setCurrentEditMode('none');
		useConfirmationModalStore.getState().close();
	};

	const onTypeEditClick = () => {
		setCurrentEditMode('type');
	};

	const onTypeSaveClick = async () => {
		await relationTypeHandleRef.current.handleSave();
		resetEditModeAndConfirmation();
	};

	const onTypeUndoClick = () => {
		if (relationTypeHandleRef.current.checkIfHasUnsavedChanges()) {
			useConfirmationModalStore.getState().open({
				title: t('confirm_unsaved_changes_title'),
				description: t('confirm_unsaved_changes_description', {
					sectionName: t('single_relation_type')
				}),
				onCancelClick: undoType,
				onConfirmClick: onTypeSaveClick,
				cancelLabel: t('confirm_unsaved_changes_cancel_button'),
				confirmLabel: t('confirm_unsaved_changes_save_button')
			});
		} else {
			undoType();
		}
	};

	const undoType = () => {
		relationTypeHandleRef.current.handleUndo();
		resetEditModeAndConfirmation();
	};

	const onEditPropertiesClick = () => {
		setCurrentEditMode('properties');
	};

	const onUndoPropertiesClick = () => {
		if (relationPropertiesHandleRef.current.checkIfHasUnsavedChanges()) {
			useConfirmationModalStore.getState().open({
				title: t('confirm_unsaved_changes_title'),
				description: t('confirm_unsaved_changes_description', {
					sectionName: t('single_view_properties_title')
				}),
				onCancelClick: undoProperties,
				onConfirmClick: onSavePropertiesClick,
				cancelLabel: t('confirm_unsaved_changes_cancel_button'),
				confirmLabel: t('confirm_unsaved_changes_save_button')
			});
		} else {
			undoProperties();
		}
	};

	const onSavePropertiesClick = async () => {
		await relationPropertiesHandleRef.current.handleSave();
		resetEditModeAndConfirmation();
	};

	const undoProperties = () => {
		relationPropertiesHandleRef.current?.handleUndo();
		resetEditModeAndConfirmation();
	};

	const onDeleteRelationClick = () => {
		useConfirmationModalStore.getState().open({
			title: t('confirm_delete_relation_title'),
			description: t('confirm_delete_relation', { id: relation.id }),
			onCancelClick: () => useConfirmationModalStore.getState().close(),
			onConfirmClick: () => {
				api.relations.actions.deleteRelationsAndUpdateApplication([relation.id]);
				useConfirmationModalStore.getState().close();
			},
			confirmLabel: t('confirm_delete_relation_button')
		});
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
								title: t('confirm_delete_relation_button'),
								onClick: onDeleteRelationClick,
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

			<DBAccordion behavior="multiple" initOpenIndex={initOpenIndexes} variant="card">
				<EditSaveBlock
					isEditable={false}
					isEditMode={false}
					headline={t('single-relation-relation')}
					onToggle={(isOpen) => {
						toggleDefaultOpenSection(sectionsLocation, 'relation-relation', isOpen);
					}}
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
					onToggle={(isOpen) => {
						toggleDefaultOpenSection(sectionsLocation, 'relation-type', isOpen);
					}}
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
					onToggle={(isOpen) => {
						toggleDefaultOpenSection(sectionsLocation, 'relation-properties', isOpen);
					}}
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
		</DBSection>
	);
};
