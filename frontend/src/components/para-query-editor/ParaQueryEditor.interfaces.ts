import { ParaQuery } from 'src/models/paraquery';
import { GlobalComponentProps } from 'src/types/components';

export type ParaQueryEditorProps = GlobalComponentProps & {
	paraQuery: ParaQuery;
	onParameterChange: (key: string, value: string) => void;
};
