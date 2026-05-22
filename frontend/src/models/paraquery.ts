import { UUID } from 'src/models/general';
import { NodeLabelId } from 'src/models/node';

export type ParaQuery = {
	cypher: string;
	description: string;
	name: string;
	parameters: Record<string, ParaQueryParameter>;
	user_text: string;
	uuid: UUID;
};

export type ParaQueryParameter = {
	default_value?: string;
	help_text: string;
	type: ParaQueryParameterType;
	suggestions?: Array<NodeLabelId>;
};

export type ParaQueryParameterType = 'string' | 'integer';
export type ParaQueryParameterValues = Record<string, string | number>;
