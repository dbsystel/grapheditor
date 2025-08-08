import { ItemProperty } from 'src/models/item';
import { Node } from 'src/models/node';
import { labelIds } from 'src/tests/data/labels';
import { testRelations } from 'src/tests/data/relations';
import { GraphEditorTypeSimplified } from 'src/utils/constants';
import { generateNode, labelsContainMetaLabels } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import { idFormatter } from 'src/utils/idFormatter';
import { generateTestProperty } from '../helpers';

let labels: Array<string> = [];

export const generateTestNode = (
	id: string,
	labels: Array<string>,
	propertyIds: Array<string>
): Node => {
	return {
		_grapheditor_type: 'node',
		id: id,
		dbId: id,
		// TODO use a correct value instead of empty string
		semanticId: labelsContainMetaLabels(labels) ? '' : null,
		title: 'Title',
		description: 'Description',
		longDescription: 'Long description',
		labels: labels,
		properties: propertyIds.reduce<Record<string, ItemProperty>>(
			(previousValue, currentValue) => {
				previousValue[
					idFormatter.formatObjectId(GraphEditorTypeSimplified.META_PROPERTY, currentValue)
				] = generateTestProperty(currentValue);

				return previousValue;
			},
			{}
		),
		style: {}
	};
};

export const testNodes: Array<Node> = [
	generateTestNode(
		'node-0',
		[labelIds[0], labelIds[1]],
		['property-1', 'property-2', 'property-3']
	),
	generateTestNode('node-1', [labelIds[1], labelIds[2]], ['property-2']),
	generateTestNode('node-2', [labelIds[1], labelIds[3]], ['property-3'])
];

testNodes.forEach((node, index) => {
	labels.push(...node.labels);

	if (index === testNodes.length - 1) {
		// store only unique values
		labels = [...new Set(labels)];
	}
});

const processedIds: Array<string> = [];
const processedNodes: Array<Node> = [];

[...testNodes, ...testRelations].forEach((item) => {
	const ids = [...Object.keys(item.properties)];

	if (!isRelation(item)) {
		ids.push(...item.labels);
	} else {
		ids.push(item.type);
	}

	ids.forEach((id) => {
		if (processedIds.includes(id) === false) {
			processedNodes.push(generateNode(id));
			processedIds.push(id);
		}
	});
});

testNodes.push(...processedNodes);

export const getTestNodesLabels = () => {
	return labels;
};

export const getTestNodesProperties = () => {
	const properties: Array<string> = [];

	testNodes.forEach((node) => {
		for (const property in node.properties) {
			properties.push(property);
		}
	});

	return [...new Set(properties)];
};

export const getTestNode = (id: string) => {
	return testNodes.find((node) => {
		return node.id === id;
	});
};
