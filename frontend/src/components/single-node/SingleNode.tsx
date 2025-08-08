import './SingleNode.scss';
import {
	DBAccordion,
	DBAccordionItem,
	DBDivider,
	DBIcon,
	DBInfotext,
	DBSection,
	DBTooltip
} from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Connections } from 'src/components/connections/Connections';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { ItemProperties } from 'src/components/item-properties/ItemProperties';
import { LoadPerspective } from 'src/components/load-perspective/LoadPerspective';
import { Loading } from 'src/components/loading/Loading';
import { MenuButton } from 'src/components/menu-button/MenuButton';
import { NodeLabelsItemFinder } from 'src/components/node-labels-item-finder/NodeLabelsItemFinder';
import { Item, ItemPropertyWithKey } from 'src/models/item';
import { MetaForMeta, Node, NodeId } from 'src/models/node';
import { useItemsStore } from 'src/stores/items';
import { GraphEditorType } from 'src/utils/constants';
import { postMetaForMeta } from 'src/utils/fetch/postMetaForMeta';
import { getItemDBId, getItemMissingPropertiesForMeta } from 'src/utils/helpers/items';
import {
	areNodesSameById,
	deleteNodesAndUpdateApplication,
	isNodePerspective,
	isPseudoNode
} from 'src/utils/helpers/nodes';
import { CopyToClipboard } from '../copy-to-clipboard/CopyToClipboard';
import { SingleNodeProps } from './SingleNode.interfaces';
/**
 * This component contains the logic to present a detailed single node view.
 */
export const SingleNode = ({ node, id, className, testId }: SingleNodeProps) => {
	const { t } = useTranslation();
	const [selectedLabelIds, setSelectedLabelIds] = useState<Array<NodeId>>([]);
	const [labelsMeta, setLabelsMeta] = useState<MetaForMeta>({});
	const [isLabelsMetaLoading, setIsLabelsMetaLoading] = useState(false);
	const rootElementClassName = clsx('single-node', className);
	const getNodesAsync = useItemsStore((store) => store.getNodesAsync);
	const [labelsValue, setLabelsValue] = useState<Array<Node>>([]);
	const [highlightedLabelTagIds, setHighlightedLabelTagIds] = useState<Array<NodeId>>([]);
	const [markedLabelIdsAsWarning, setMarkedLabelIdsAsWarning] = useState<Array<NodeId>>([]);

	useEffect(() => {
		getNodeLabelsNodes();
		getMetaForMeta();
	}, [node]);

	const getNodeLabelsNodes = () => {
		getNodesAsync(node.labels).then((labels) => {
			setLabelsValue(labels);
		});
	};

	const getMetaForMeta = () => {
		setIsLabelsMetaLoading(true);

		postMetaForMeta({
			ids: node.labels,
			resultType: GraphEditorType.META_PROPERTY
		})
			.then((data) => {
				const nodeMissingProperties = getItemMissingPropertiesForMeta(
					node,
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

	const onPropertyRowMouseEnter = (
		item: Item,
		propertyWithKey: ItemPropertyWithKey,
		propertyNode: Node
	) => {
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

	const renderPseudoNodeWarning = isPseudoNode(node);

	return (
		<DBSection id={id} className={rootElementClassName} data-testid={testId} spacing="none">
			{renderPseudoNodeWarning && (
				<div className="single-node__pseudo-node-warning">
					<DBInfotext semantic="warning">
						{t('single_node_pseudo_node_warning')}
					</DBInfotext>
				</div>
			)}

			<div className="single-node__title">
				<DBIcon icon="box" />

				<p className="single-node__title-title">
					{node.title}{' '}
					<DBTooltip placement="bottom-end">
						{t('single-node-node')} {node.title}
					</DBTooltip>
				</p>

				<MenuButton
					optionsPlacement="bottom-start"
					buttonSize="small"
					options={[
						{
							title: t('single-node-delete-item-button'),
							onClick: () => deleteNodesAndUpdateApplication([node.id]),
							icon: 'bin'
						}
					]}
				/>
			</div>

			<LoadPerspectiveButton />

			<div className="single-node__header">
				<div className="single-node__header-id">
					<div className="single-node__header-content-wrapper">
						<p className="single-node__header-headline">ID</p>
						<p className="single-node__header-content">{nodeId}</p>
					</div>

					<CopyToClipboard text={nodeId} />
				</div>
			</div>

			<DBDivider className="divider" />

			<DBAccordion behavior="multiple" initOpenIndex={[0, 1, 2, 3]}>
				<DBAccordionItem headline={t('single_view_description')}>
					{node.description}
				</DBAccordionItem>

				<DBAccordionItem headline={t('single_node_labels_title')}>
					<ErrorBoundary>
						<NodeLabelsItemFinder
							mode="edit"
							node={node}
							value={labelsValue}
							onTagsSelected={onUserSelectedLabelsChange}
							highlightedTagIds={highlightedLabelTagIds}
							markTagIdsAsWarning={markedLabelIdsAsWarning}
						/>
					</ErrorBoundary>
				</DBAccordionItem>

				<DBAccordionItem headline={t('single_view_properties_title')}>
					<ErrorBoundary>
						<Loading
							isLoading={isLabelsMetaLoading}
							wrapChildren={false}
							renderChildrenWhileLoading={true}
						>
							<ItemProperties
								item={node}
								metaData={labelsMeta}
								filterMetaByNodeIds={selectedLabelIds}
								onPropertyRowMouseEnter={onPropertyRowMouseEnter}
								onPropertyRowMouseLeave={onPropertyRowMouseLeave}
							/>
						</Loading>
					</ErrorBoundary>
				</DBAccordionItem>

				<DBAccordionItem headline={t('connections_title')}>
					<ErrorBoundary>
						<Connections node={node} />
					</ErrorBoundary>
				</DBAccordionItem>
			</DBAccordion>
		</DBSection>
	);
};
