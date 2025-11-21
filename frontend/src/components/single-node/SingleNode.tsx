import 'src/assets/scss/single-item.scss';
import './SingleNode.scss';
import {
	DBAccordion,
	DBButton,
	DBIcon,
	DBInfotext,
	DBSection,
	DBTooltip
} from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Connections } from 'src/components/connections/Connections';
import { CopyToClipboard } from 'src/components/copy-to-clipboard/CopyToClipboard';
import { EditSaveBlock } from 'src/components/edit-save-block/EditSaveBlock';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { ItemCenterButton } from 'src/components/item-center-button/ItemCenterButton';
import { ItemProperties } from 'src/components/item-properties/ItemProperties';
import { ItemPropertiesHandle } from 'src/components/item-properties/ItemProperties.interfaces';
import { useItemsDrawerContext } from 'src/components/items-drawer/context/ItemsDrawerContext';
import { LoadPerspective } from 'src/components/load-perspective/LoadPerspective';
import { Loading } from 'src/components/loading/Loading';
import { MarkdownWrapper } from 'src/components/markdown-wrapper/Markdown-Wrapper';
import { MenuButton } from 'src/components/menu-button/MenuButton';
import { NodeLabelsItemFinder } from 'src/components/node-labels-item-finder/NodeLabelsItemFinder';
import { NodeLabelsItemFinderHandle } from 'src/components/node-labels-item-finder/NodeLabelsItemFinder.interfaces';
import { UnsavedChangedModalProps } from 'src/components/unsaved-changes-modal/UnsavedChangedModal.interfaces';
import { UnsavedChangesModal } from 'src/components/unsaved-changes-modal/UnsavedChangesModal';
import { ItemPropertyWithKey } from 'src/models/item';
import { MetaForMeta, Node, NodeId } from 'src/models/node';
import { useDrawerStore } from 'src/stores/drawer';
import { useGraphStore } from 'src/stores/graph';
import { useSearchStore } from 'src/stores/search';
import { metaForMetaApi } from 'src/utils/api/metaForMeta';
import { nodesApi } from 'src/utils/api/nodes';
import { GraphEditorType } from 'src/utils/constants';
import { GRAPH_PRESENTATION_GRAPH } from 'src/utils/constants';
import { twoObjectValuesAreEqual } from 'src/utils/helpers/general';
import { getItemDBId, getItemMissingPropertiesForMeta } from 'src/utils/helpers/items';
import { areNodesSameById, isNodePerspective, isPseudoNode } from 'src/utils/helpers/nodes';
import { idFormatter } from 'src/utils/idFormatter';
import { formatItemId } from 'src/utils/idFormatter';
import { SingleNodeEditMode, SingleNodeProps } from './SingleNode.interfaces';

/**
 * This component contains the logic to present a detailed single node view.
 */
export const SingleNode = ({
	node,
	variant,
	isEditable = true,
	shouldShowOpenButton,
	shouldShowCenterButton,
	id,
	className,
	testId
}: SingleNodeProps) => {
	const { t } = useTranslation();
	const sigma = useGraphStore((store) => store.sigma);
	const { isInsideItemsDrawer } = useItemsDrawerContext();
	const presentation = useSearchStore((store) => store.presentation);
	const isCenterButtonDisabled =
		presentation !== GRAPH_PRESENTATION_GRAPH || !sigma.getGraph().hasNode(node.id);
	const [selectedLabelIds, setSelectedLabelIds] = useState<Array<NodeId>>([]);
	const [labelsMeta, setLabelsMeta] = useState<MetaForMeta | null>(null);
	const [isLabelsMetaLoading, setIsLabelsMetaLoading] = useState(false);
	const [labelsValue, setLabelsValue] = useState<Array<Node>>([]);
	const [highlightedLabelTagIds, setHighlightedLabelTagIds] = useState<Array<NodeId>>([]);
	const [markedLabelIdsAsWarning, setMarkedLabelIdsAsWarning] = useState<Array<NodeId>>([]);
	const [currentEditMode, setCurrentEditMode] = useState<SingleNodeEditMode>('none');
	const [unsavedChangesData, setUnsavedChangesData] = useState<UnsavedChangedModalProps | null>(
		null
	);
	const nodeLabelsHandleRef = useRef<NodeLabelsItemFinderHandle>(null);
	const nodePropertiesHandleRef = useRef<ItemPropertiesHandle>(null);
	const rootElementClassName = clsx(
		'single-node single-item',
		{
			'single-item--small': variant === 'small'
		},
		className
	);

	useEffect(() => {
		getNodeLabelsNodes();
		getMetaForMeta();
	}, [node]);

	const getNodeLabelsNodes = () => {
		nodesApi.postNodesBulkFetch({ nodeIds: node.labels }).then((labelsNodes) => {
			setLabelsValue(labelsNodes);
		});
	};

	const getMetaForMeta = () => {
		setIsLabelsMetaLoading(true);

		metaForMetaApi
			.postMetaForMeta({
				ids: node.labels,
				resultType: GraphEditorType.META_PROPERTY
			})
			.then((data) => {
				const nodeMissingProperties = getItemMissingPropertiesForMeta(
					node.properties,
					data.data.nodes
				);

				setLabelsMeta(data.data.nodes);
				setMarkedLabelIdsAsWarning(nodeMissingProperties.missingPropertiesIds);
			})
			.finally(() => {
				setIsLabelsMetaLoading(false);
			});
	};

	const onUserSelectedLabelsChange = (selectedLabels: Array<Node>) => {
		if (selectedLabels.length) {
			setSelectedLabelIds(selectedLabels.map((label) => label.id));
		} else {
			setSelectedLabelIds([]);
		}
	};

	const onPropertyRowMouseEnter = (propertyWithKey: ItemPropertyWithKey, propertyNode: Node) => {
		if (!labelsMeta) {
			return;
		}

		const highlightedLabelIds: Array<NodeId> = [];

		for (const [metaKey, metaNodes] of Object.entries(labelsMeta)) {
			metaNodes.forEach((metaNode) => {
				if (areNodesSameById(metaNode, propertyNode)) {
					highlightedLabelIds.push(metaKey);
				}
			});
		}

		setHighlightedLabelTagIds(highlightedLabelIds);
	};

	const onPropertyRowMouseLeave = () => {
		setHighlightedLabelTagIds([]);
	};

	const nodeId = getItemDBId(node);
	// had to create a "nodeId" variable explicitly, since direct use of node.id
	// on the LoadPerspective component would cause "missing in props validation" eslint error

	const LoadPerspectiveButton = () => {
		if (isNodePerspective(node)) {
			return <LoadPerspective perspectiveId={nodeId} />;
		}

		return null;
	};

	const resetEditModeAndUnsavedChangesData = () => {
		setCurrentEditMode('none');
		setUnsavedChangesData(null);
	};

	const onEditLabelsClick = () => {
		setCurrentEditMode('labels');
	};

	const onSaveLabelsClick = async () => {
		await nodeLabelsHandleRef.current?.handleSave();
		resetEditModeAndUnsavedChangesData();
	};

	const onUndoLabelsClick = () => {
		if (!twoObjectValuesAreEqual(node.labels, nodeLabelsHandleRef.current?.labels)) {
			setUnsavedChangesData({
				unsavedSectionName: t('single_node_labels_title'),
				onCancelClick: undoLabels,
				onSaveClick: onSaveLabelsClick
			});
		} else {
			undoLabels();
		}
	};

	const undoLabels = () => {
		nodeLabelsHandleRef.current?.handleUndo();
		resetEditModeAndUnsavedChangesData();
	};

	const onEditPropertiesClick = () => {
		setCurrentEditMode('properties');
	};

	const onUndoPropertiesClick = () => {
		if (
			!twoObjectValuesAreEqual(node.properties, nodePropertiesHandleRef.current?.properties)
		) {
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
		await nodePropertiesHandleRef.current?.handleSave();
		resetEditModeAndUnsavedChangesData();
	};

	const undoProperties = () => {
		nodePropertiesHandleRef.current?.handleUndo();
		resetEditModeAndUnsavedChangesData();
	};

	const onEditConnectionsClick = () => {
		setCurrentEditMode('connections');
	};

	const openInItemsDrawer = () => {
		if (isInsideItemsDrawer) {
			useDrawerStore.getState().addEntry({ item: node });
		} else {
			useDrawerStore.getState().setEntry({ item: node });
		}
	};

	const renderPseudoNodeWarning = isPseudoNode(node);

	return (
		<DBSection id={id} className={rootElementClassName} data-testid={testId} spacing="none">
			<div className="single-item__header db-bg-color-basic-level-1">
				{renderPseudoNodeWarning && (
					<div className="single-node__pseudo-node-warning">
						<DBInfotext semantic="warning">
							{t('single_node_pseudo_node_warning')}
						</DBInfotext>
					</div>
				)}

				<div className="single-item__title">
					<DBIcon icon="box" />

					<p className="single-item__title-title">
						{node.title}{' '}
						<DBTooltip className="db-tooltip-fix db-tooltip-fix--bottom">
							{t('single-node-node')} {idFormatter.parseIdToName(node.title)}
						</DBTooltip>
					</p>

					<MenuButton
						optionsPlacement="bottom-start"
						buttonSize="small"
						options={[
							{
								title: t('single-node-delete-item-button'),
								onClick: () => nodesApi.deleteNodesAndUpdateApplication([node.id]),
								icon: 'bin'
							}
						]}
					/>

					<div className="single-item__buttons-right">
						{shouldShowCenterButton && (
							<ItemCenterButton item={node} isDisabled={isCenterButtonDisabled} />
						)}

						{shouldShowOpenButton && (
							<DBButton size="small" variant="ghost" onClick={openInItemsDrawer}>
								{t('single_item_open')}
							</DBButton>
						)}
					</div>
				</div>

				<LoadPerspectiveButton />

				<div className="single-item__header-id">
					<p className="single-item__header-headline">ID</p>
					<p className="single-item__header-content">
						{formatItemId(nodeId)}
						<DBTooltip
							className="db-tooltip-fix db-tooltip-fix--bottom"
							width="auto"
							showArrow={false}
						>
							{nodeId}
						</DBTooltip>
					</p>

					<CopyToClipboard text={nodeId} />
				</div>
			</div>

			<DBAccordion behavior="multiple" initOpenIndex={[0, 1, 2, 3]} variant="card">
				<EditSaveBlock
					isEditMode={false}
					isEditable={false}
					headline={t('single_view_description')}
				>
					<MarkdownWrapper className="single-item__description">
						{node.description}
					</MarkdownWrapper>
				</EditSaveBlock>

				<EditSaveBlock
					isEditable={isEditable}
					isEditMode={currentEditMode === 'labels'}
					headline={t('single_node_labels_title')}
					onEditClick={onEditLabelsClick}
					onSaveClick={onSaveLabelsClick}
					onUndoClick={onUndoLabelsClick}
				>
					<NodeLabelsItemFinder
						handleRef={nodeLabelsHandleRef}
						mode="edit"
						node={node}
						value={labelsValue}
						onTagsSelected={onUserSelectedLabelsChange}
						highlightedTagIds={highlightedLabelTagIds}
						markTagIdsAsWarning={markedLabelIdsAsWarning}
						isEditMode={currentEditMode === 'labels'}
						isSelectAllDisabled={variant === 'small'}
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
						isLoading={isLabelsMetaLoading}
						wrapChildren={false}
						renderChildrenWhileLoading={false}
					>
						<ItemProperties
							item={node}
							metaData={labelsMeta || undefined}
							filterMetaByNodeIds={selectedLabelIds}
							onPropertyRowMouseEnter={onPropertyRowMouseEnter}
							onPropertyRowMouseLeave={onPropertyRowMouseLeave}
							isEditMode={currentEditMode === 'properties'}
							handleRef={nodePropertiesHandleRef}
						/>
					</Loading>
				</EditSaveBlock>

				<EditSaveBlock
					isEditable={false}
					isEditMode={false}
					headline={t('connections_title')}
					onEditClick={onEditConnectionsClick}
				>
					<ErrorBoundary>
						<Connections node={node} isEditMode={isEditable} />
					</ErrorBoundary>
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
