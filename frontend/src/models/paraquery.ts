import { UUID } from 'src/models/general';

export type ParaQuery = {
	cypher: string;
	description: string;
	name: string;
	parameters: ParaQueryParameters;
	user_text: string;
	uuid: UUID;
	db_id: string;
};

export type ParaQueryParameters = Record<string, ParaQueryParameter>;

export type ParaQueryParameter = {
	default_value?: ParaQueryParameterValueWithoutNull;
	help_text: string;
	type: ParaQueryParameterType;
	suggestions?: Array<ParaQueryParameterValueWithoutNull>;
};

export type ParaQueryParameterType = 'string' | 'integer';
export type ParaQueryParameterValue = string | number | null;
export type ParaQueryParameterValueWithoutNull = Exclude<ParaQueryParameterValue, null>;
export type ParaQueryParameterValues = Record<string, ParaQueryParameterValue>;
