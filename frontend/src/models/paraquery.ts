import { NodeLabelId } from 'src/models/node';

export type ParaQuery = {
	cypher: string;
	description: string;
	user_text: string;
	parameters: Record<string, ParaQueryParameter>;
};

export type ParaQueryParameter = {
	default_value: string;
	help_text: string;
	type: 'string';
	suggestions: Array<NodeLabelId>;
};
