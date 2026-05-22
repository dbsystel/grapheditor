import { ParaQuery, ParaQueryParameterType, ParaQueryParameterValues } from 'src/models/paraquery';
import { GlobalComponentProps } from 'src/types/components';

export type ParaQueryEditorProps = GlobalComponentProps & {
	paraQuery: ParaQuery;
	onParameterChange: (key: string, value: string, type: ParaQueryParameterType) => void;
	defaultParameterValues?: ParaQueryParameterValues;
};
