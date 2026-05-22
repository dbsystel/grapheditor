import './Connections.scss';
import { DBButton, DBIcon, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { MenuButton } from 'src/components/menu-button/MenuButton';
import { Table } from 'src/components/table/Table';
import { TableBody } from 'src/components/table-body/TableBody';
import { TableCell } from 'src/components/table-cell/TableCell';
import { TableRow } from 'src/components/table-row/TableRow';
import { Relation } from 'src/models/relation';
import { useConfirmationModalStore } from 'src/stores/confirmation-modal';
import { useGraphStore } from 'src/stores/graph';
import { api } from 'src/utils/api/api';
import {
	getDirectionIcon,
	processNodeConnections,
	sortNodeConnections
} from 'src/utils/helpers/nodes';
import { idFormatter } from 'src/utils/id-formatter';
import {
	ConnectionRenderDirectionProps,
	ConnectionsBoxProps,
	ConnectionsData,
	ConnectionsProps
} from './Connections.interfaces';
import { ConnectionsAddRelation } from './tabs/add-relation/ConnectionsAddRelation';

/**
 * This component contains a list of relations between nodes.
 * Depending on from which startpoint it has been rendered.
 */
export const Connections = ({ node, isEditMode, id, className, testId }: ConnectionsProps) => {
	const { t } = useTranslation();
	const [connectionBoxData, setConnectionBoxData] = useState<ConnectionsData>([]);
	const [newConnectionBoxData, setNewConnectionBoxData] = useState<ConnectionsData>([]);
	const rootElementClassName = clsx('connections', className);
	const [renderKey, setRenderKey] = useState('');

	useEffect(() => {
		(async () => {
			const response = await api.nodes.fetch.postNodeConnections({ nodeId: node.id });
			const connectionsArray = processNodeConnections(node, response.data.relations);

			setConnectionBoxData(connectionsArray);
		})();
	}, [node, renderKey]);

	const onDelete = (relation: Relation) => {
		useConfirmationModalStore.getState().open({
			title: t('confirm_delete_relation_title'),
			description: t('confirm_delete_relation', { id: relation.id }),
			onCancelClick: () => useConfirmationModalStore.getState().close(),
			onConfirmClick: () => {
				api.relations.actions
					.deleteRelationsAndUpdateApplication([relation.id])
					.then(() => {
						setConnectionBoxData((prevState) => {
							return prevState.filter((connection) => {
								if (!connection.relation) {
									return true;
								}

								return connection.relation.id !== relation.id;
							});
						});

						useGraphStore.getState().indexParallelRelations();
						useGraphStore.getState().adaptRelationsTypeAndCurvature();
					});
				useConfirmationModalStore.getState().close();
			},
			confirmLabel: t('confirm_delete_relation_button')
		});
	};

	const onSave = () => {
		setRenderKey(window.crypto.randomUUID());
	};

	const onTabClose = () => {
		setRenderKey(window.crypto.randomUUID());

		setNewConnectionBoxData([]);
	};

	const sortedConnections = sortNodeConnections(node, newConnectionBoxData, connectionBoxData);

	return (
		<section id={id} className={rootElementClassName} data-testid={testId}>
			{isEditMode && (
				<ConnectionsAddRelation refItem={node} onSave={onSave} onTabClose={onTabClose} />
			)}
			<Table className="connections__overview">
				<ConnectionsBox
					node={node}
					data={sortedConnections.newRelationsIncoming}
					direction="incoming"
					onDelete={onDelete}
					className="connections__new-value"
					isEditMode={isEditMode}
				/>
				<ConnectionsBox
					node={node}
					data={sortedConnections.newRelationsOutgoing}
					direction="outgoing"
					onDelete={onDelete}
					className="connections__new-value"
					isEditMode={isEditMode}
				/>

				<ConnectionsBox
					node={node}
					data={sortedConnections.relationsIncoming}
					direction="incoming"
					onDelete={onDelete}
					isEditMode={isEditMode}
				/>
				<ConnectionsBox
					node={node}
					data={sortedConnections.relationsOutgoing}
					direction="outgoing"
					onDelete={onDelete}
					isEditMode={isEditMode}
				/>
			</Table>
		</section>
	);
};

/**
 * ConnectionBox is a component used for 3 different occasions.
 * 1. it shows if a node has incoming relations to another node, by also naming the relation type.
 * 2. it shows if a node has outgoing relations to another node, by also naming the relation type.
 * 3. it's uses on a relation detail view to show if the relation connects two nodes.
 * The span is an arrow that shows the direction the relation goes to.
 */

const ConnectionsBox = ({
	title,
	data,
	node,
	direction,
	onDelete,
	className,
	isEditMode
}: ConnectionsBoxProps) => {
	const { t } = useTranslation();

	if (!title && !data) {
		return null;
	}

	return (
		<TableBody className={className}>
			{data.map((dataItem, index) => {
				const relation = dataItem.relation;
				const sourceNode = dataItem.source;
				const targetNode = dataItem.target;
				const metarelation = dataItem.metarelation;
				// Determine the "other" node (not the current node)
				const otherNode = direction === 'incoming' ? sourceNode : targetNode;
				const isSelfLoop = otherNode?.id === node.id;

				return (
					<TableRow key={index} variant="hoverable">
						<TableCell className="connections__cell connections__icon-only">
							<div className="connections__node-icon">
								<DBButton variant="ghost" size="small" noText type="button">
									<DBIcon icon="box" />
									<DBTooltip placement="right">
										{t('single-node-node')}{' '}
										{idFormatter.parseIdToName(node.title)}
									</DBTooltip>
								</DBButton>
							</div>
						</TableCell>

						<TableCell className="connections__cell connections__icon-only connections__cell-direction">
							{relation && (
								<RenderDirection
									direction={direction}
									isSelfLoop={isSelfLoop}
									relation={relation}
								/>
							)}
						</TableCell>

						<TableCell className="connections__cell connections__relation-name">
							{metarelation && <ItemInfo item={metarelation} asTag={true} />}
						</TableCell>

						{direction === 'incoming' && sourceNode && (
							<TableCell className="connections__cell connections__node">
								<ItemInfo item={sourceNode} />
							</TableCell>
						)}
						{direction === 'outgoing' && targetNode && (
							<TableCell className="connections__cell connections__node">
								<ItemInfo item={targetNode} />
							</TableCell>
						)}

						{isEditMode && relation && (
							<TableCell
								width="minimal"
								className="connections__cell connections__icon-only connections__menu"
							>
								<MenuButton
									optionsPlacement="bottom-end"
									className="connections__menu-button menu-button--inline-end-fix"
									options={[
										{
											icon: 'bin',
											title: t('connections-delete-relation-button'),
											onClick: () => onDelete(relation),
											closeMenuOnClick: true
										}
									]}
									shouldIgnorePositionFix={true}
								/>
							</TableCell>
						)}
					</TableRow>
				);
			})}
		</TableBody>
	);
};

const RenderDirection = ({ direction, isSelfLoop, relation }: ConnectionRenderDirectionProps) => {
	if (!relation) {
		return null;
	}

	const icon = getDirectionIcon(direction, isSelfLoop);

	return (
		<ItemInfo item={relation}>
			<DBIcon icon={icon} weight="32" />
		</ItemInfo>
	);
};
