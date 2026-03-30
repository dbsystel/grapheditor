import { ParaQuery } from 'src/models/paraquery';
import { GetParaQueriesResponse } from 'src/utils/fetch/getParaQueries';

const uuid1 = window.crypto.randomUUID();
const testParaQuery1Id = `id::4:${uuid1}:0`;
const uuid2 = window.crypto.randomUUID();
const testParaQuery2Id = `id::4:${uuid2}:52`;

export const testParaQueries: Record<string, ParaQuery> = {};

testParaQueries[testParaQuery1Id] = {
	description:
		'Return all nodes that have a specific property and a certain value on a property.',
	user_text: 'I want all nodes with $label and $propertyName=$propertyValue.',
	cypher: 'match (a:$($label)) where a[$propertyName] = $propertyValue return a',
	uuid: uuid1,
	name: 'ParaQuery 1',
	parameters: {
		label: {
			help_text: 'Selection of available node types.',
			type: 'string',
			suggestions: [
				'MetaLabel__tech_',
				'MetaProperty__tech_',
				'MetaRelation__tech_',
				'Namespace__tech_',
				'Parameter__tech_',
				'Paraquery__tech_',
				'Person__dummy_',
				'Restriction__tech_',
				'___tech_'
			],
			default_value: 'Person__dummy_'
		},
		propertyName: {
			help_text: 'Selection of available node properties.',
			type: 'string',
			suggestions: [
				'_ft__tech_',
				'_uuid__tech_',
				'cypher__tech_',
				'description__tech_',
				'help_text__tech_',
				'name__dummy_',
				'name__tech_',
				'selection__tech_',
				'type__tech_',
				'user_text__tech_'
			],
			default_value: 'name__dummy_'
		},
		propertyValue: {
			help_text: 'A node property value.',
			type: 'string'
		}
	}
};

testParaQueries[testParaQuery2Id] = {
	description: 'Return all nodes of a certain type',
	user_text: 'I want all nodes of type $label.',
	cypher: 'match (a:$($label)) return a',
	name: 'ParaQuery 2',
	uuid: uuid2,
	parameters: {
		label: {
			help_text: 'Selection of available node types.',
			type: 'string',
			suggestions: [
				'MetaLabel__tech_',
				'MetaProperty__tech_',
				'MetaRelation__tech_',
				'Namespace__tech_',
				'Parameter__tech_',
				'Paraquery__tech_',
				'Person__dummy_',
				'Restriction__tech_',
				'___tech_'
			],
			default_value: 'Person__dummy_'
		}
	}
};

export const testParaQueriesResponse: GetParaQueriesResponse = {
	paraqueries: [
		[testParaQuery1Id, testParaQueries[testParaQuery1Id].description],
		[testParaQuery2Id, testParaQueries[testParaQuery2Id].description]
	]
};
