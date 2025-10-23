import './ParallaxRelations.scss';
import { DBCheckbox, DBIcon } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent } from 'react';
import { ItemOverviewButton } from 'src/components/item-overview-button/ItemOverviewButton';
import { Table } from 'src/components/table/Table';
import { TableBody } from 'src/components/table-body/TableBody';
import { TableCell } from 'src/components/table-cell/TableCell';
import { TableRow } from 'src/components/table-row/TableRow';
import { ParallaxRelationsProps, ParallaxRelationsRowProps } from './ParallaxRelations.interfaces';

export const ParallaxRelations = ({
	nextStepRelations,
	onRelationChange,
	selectedRelations,
	id,
	className,
	testId
}: ParallaxRelationsProps) => {
	const rootElementClassName = clsx('parallax-relations', className);

	return (
		<Table id={id} className={rootElementClassName} testId={testId}>
			<TableBody className={className}>
				{nextStepRelations.incomingRelationTypes.map((relationType, index) => (
					<RelationRow
						key={`incoming-${index}`}
						relationType={relationType}
						type="incomingRelationTypes"
						onChange={onRelationChange}
						isSelected={selectedRelations.incomingRelationTypes.includes(relationType)}
					/>
				))}

				{nextStepRelations.outgoingRelationTypes.map((relationType, index) => (
					<RelationRow
						key={`outgoing-${index}`}
						relationType={relationType}
						type="outgoingRelationTypes"
						onChange={onRelationChange}
						isSelected={selectedRelations.outgoingRelationTypes.includes(relationType)}
					/>
				))}
			</TableBody>
		</Table>
	);
};

const RelationRow = ({ relationType, type, onChange, isSelected }: ParallaxRelationsRowProps) => {
	const localOnChange = (event: ChangeEvent<HTMLInputElement>) => {
		onChange(relationType, type, event.target.checked);
	};

	return (
		<TableRow variant="hoverable">
			<TableCell>
				<DBCheckbox onChange={localOnChange} checked={isSelected} />
			</TableCell>

			<TableCell>
				<DBIcon icon="box" />
			</TableCell>

			<TableCell>
				<DBIcon icon={type === 'incomingRelationTypes' ? 'arrow_left' : 'arrow_right'} />
			</TableCell>

			<TableCell>
				<ItemOverviewButton nodeId={relationType} />
			</TableCell>
		</TableRow>
	);
};
