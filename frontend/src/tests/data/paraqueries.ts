import { ParaQuery } from 'src/models/paraquery';

export const testParaQueries: Record<string, ParaQuery> = {
	'id::4:bb368931-775e-4eb9-a9fd-a06c3b6efc14:0': {
		description:
			'Return all nodes that have a specific property and a certain value on a property.',
		user_text: 'I want all nodes with $label and $propertyName=$propertyValue.',
		cypher: 'match (a:$($label)) where a[$propertyName] = $propertyValue return a',
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
	},
	'id::4:bb368931-775e-4eb9-a9fd-a06c3b6efc14:52': {
		description: 'Return all nodes of a certain type',
		user_text: 'I want all nodes of type $label.',
		cypher: 'match (a:$($label)) return a',
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
	}
};
