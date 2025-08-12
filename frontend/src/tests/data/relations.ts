import { ItemProperty } from 'src/models/item';
import { Relation } from 'src/models/relation';
import { typeIds } from 'src/tests/data/types';
import { generateTestProperty } from 'src/tests/helpers';
import { GraphEditorTypeSimplified } from 'src/utils/constants';
import { idFormatter } from 'src/utils/idFormatter';

export const generateTestRelation = (
	id: string,
	type: string,
	propertyIds: Array<string>,
	sourceId: string,
	targetId: string
): Relation => {
	return {
		_grapheditor_type: 'relation',
		id: id,
		dbId: id,
		title: 'Title',
		description: 'Description',
		longDescription: 'Long description',
		type: type,
		properties: propertyIds.reduce<Record<string, ItemProperty>>(
			(previousValue, currentValue) => {
				previousValue[
					idFormatter.formatSemanticId(
						GraphEditorTypeSimplified.META_PROPERTY,
						currentValue,
						'unknown'
					)
				] = generateTestProperty(currentValue);

				return previousValue;
			},
			{}
		),
		source_id: sourceId,
		target_id: targetId,
		style: {}
	};
};

export const testRelations: Array<Relation> = [
	generateTestRelation('relation-0', typeIds[0], ['property-1'], 'node-1', 'node-2'),
	generateTestRelation(
		'relation-1',
		typeIds[1],
		['property-1', 'property-2'],
		'node-0',
		'node-2'
	),
	generateTestRelation('relation-2', typeIds[2], [], 'node-0', 'node-1')
];
