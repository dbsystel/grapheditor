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
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { useGraphStore } from 'src/stores/graph';
import { api } from 'src/utils/api/api';
import { processNodeConnections, sortNodeConnections } from 'src/utils/helpers/nodes';
import { idFormatter } from 'src/utils/id-formatter';
import { ConnectionObject, ConnectionsBoxProps, ConnectionsProps } from './Connections.interfaces';
import { ConnectionsAddRelation } from './tabs/add-relation/ConnectionsAddRelation';

/**
 * This component contains a list of relations between nodes.
 * Depending on from which startpoint it has been rendered.
 */
export const Connections = ({ node, isEditMode, id, className, testId }: ConnectionsProps) => {
	const [connectionBoxData, setConnectionBoxData] = useState<Array<ConnectionObject>>([]);
	const [newConnectionBoxData, setNewConnectionBoxData] = useState<Array<ConnectionObject>>([]);
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
		api.relations.actions.deleteRelationsAndUpdateApplication([relation.id]).then(() => {
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
	};

	const onSave = (sourceNode: Node, targetNode: Node, relation: Relation) => {
		const newConnection: ConnectionObject = {
			target: targetNode,
			relation: relation,
			source: sourceNode
		};

		setNewConnectionBoxData((prevState) => [...prevState, newConnection]);
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
 *
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

				return (
					<TableRow key={index} variant="hoverable">
						<TableCell className="connections__cell connections__icon-only">
							<div className="connections__node-icon">
								<DBButton variant="ghost" size="small" noText>
									<DBIcon icon="box" />
									<DBTooltip placement="right">
										{t('single-node-node')}{' '}
										{idFormatter.parseIdToName(node.title)}
									</DBTooltip>
								</DBButton>
							</div>
						</TableCell>

						<TableCell className="connections__cell connections__icon-only">
							{(() => {
								// Determine the "other" node (not the current node)
								const otherNode =
									direction === 'incoming' ? sourceNode : targetNode;
								const isSelfReference = otherNode?.id === node.id;

								if (direction === 'outgoing' && !isSelfReference) {
									return <div data-icon="arrow_right"></div>;
								}
								if (direction === 'incoming' && !isSelfReference) {
									return <div data-icon="arrow_left"></div>;
								}

								if (isSelfReference) {
									return <div data-icon="undo"></div>;
								}
								return null;
							})()}
						</TableCell>

						<TableCell className="connections__cell connections__relation-name">
							{relation && <ItemInfo item={relation} />}
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
									className="connections__menu-button menu-button--ignore-position-fix menu-button--inline-end-fix"
									options={[
										{
											icon: 'bin',
											title: t('connections-delete-relation-button'),
											onClick: () => onDelete(relation),
											closeMenuOnClick: true
										}
									]}
								/>
							</TableCell>
						)}
					</TableRow>
				);
			})}
		</TableBody>
	);
};
