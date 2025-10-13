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
import { nodesApi } from 'src/utils/api/nodes';
import { relationsApi } from 'src/utils/api/relations';
import { processNodeConnections, sortNodeConnections } from 'src/utils/helpers/nodes';
import { ConnectionObject, ConnectionsBoxProps, ConnectionsProps } from './Connections.interfaces';
import { ConnectionsAddRelation } from './tabs/add-relation/ConnectionsAddRelation';

/**
 * This component contains a list of relations between nodes.
 * Depending on from which startpoint it has been rendered.
 */

function getDirectionIcon(sourceNode: Node, targetNode: Node, direction:string ): string{
	return sourceNode.id == targetNode.id ? "undo": 
	"";
}

export const Connections = ({ node, id, className, testId }: ConnectionsProps) => {
	const [connectionBoxData, setConnectionBoxData] = useState<Array<ConnectionObject>>([]);
	const [newConnectionBoxData, setNewConnectionBoxData] = useState<Array<ConnectionObject>>([]);
	const rootElementClassName = clsx('connections', className);
	const [renderKey, setRenderKey] = useState('');

	useEffect(() => {
		(async () => {
			const response = await nodesApi.postNodeConnections({ nodeId: node.id });
			const connectionsArray = processNodeConnections(node, response.data.relations);

			setConnectionBoxData(connectionsArray);
		})();
	}, [node, renderKey]);

	const onDelete = (relation: Relation) => {
		relationsApi.deleteRelationsAndUpdateApplication([relation.id]).then(() => {
			setConnectionBoxData((prevState) => {
				return prevState.filter((connection) => {
					if (!connection.relation) {
						return true;
					}

					return connection.relation.id !== relation.id;
				});
			});
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
			<ConnectionsAddRelation refItem={node} onSave={onSave} onTabClose={onTabClose} />
			<Table className="connections__overview">
				<ConnectionsBox
					node={node}
					data={sortedConnections.newRelationsIncoming}
					direction="incoming"
					onDelete={onDelete}
					className="connections__new-value"
				/>
				<ConnectionsBox
					node={node}
					data={sortedConnections.newRelationsOutgoing}
					direction="outgoing"
					onDelete={onDelete}
					className="connections__new-value"
				/>

				<ConnectionsBox
					node={node}
					data={sortedConnections.relationsIncoming}
					direction="incoming"
					onDelete={onDelete}
				/>
				<ConnectionsBox
					node={node}
					data={sortedConnections.relationsOutgoing}
					direction="outgoing"
					onDelete={onDelete}
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
	className
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
					<TableRow key={index} className="table-row--hoverable-row">
						<TableCell className="connections__cell connections__icon-only">
							<div className="connections__node-icon">
								<DBButton variant="ghost" size="small" noText>
									<DBIcon icon="box" />
									<DBTooltip placement="right">
										{t('single-node-node')} {node.title}
									</DBTooltip>
								</DBButton>
							</div>
						</TableCell>

						<TableCell className="connections__cell connections__icon-only">
							{direction === 'outgoing' && <div data-icon="arrow_right"></div>}
							{direction === 'incoming' && <div data-icon="arrow_left"></div>}
							{sourceNode?.semanticId === targetNode?.semanticId && <div data-icon="undo"></div>}
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

						<TableCell
							width="minimal"
							className="connections__cell connections__icon-only connections__menu"
						>
							{relation && (
								<MenuButton
									optionsPlacement="bottom-end"
									className="connections__menu-button"
									options={[
										{
											icon: 'bin',
											title: t('connections-delete-relation-button'),
											onClick: () => onDelete(relation)
										}
									]}
								/>
							)}
						</TableCell>
					</TableRow>
				);
			})}
		</TableBody>
	);
};
