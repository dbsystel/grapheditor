import { RefObject } from 'react';
import {
	ParaQuery,
	ParaQueryParameterType,
	ParaQueryParameterValue,
	ParaQueryParameterValues
} from 'src/models/paraquery';
import { GlobalComponentProps } from 'src/types/components';

export type ParaQueryEditorProps = GlobalComponentProps & {
	paraQuery: ParaQuery;
	onParameterChange?: (
		key: string,
		value: ParaQueryParameterValue,
		type: ParaQueryParameterType
	) => void;
	handleRef?: RefObject<ParaQueryEditorHandle>;
};

export type ParaQueryEditorHandle = {
	getParameterValues: () => ParaQueryParameterValues;
};
