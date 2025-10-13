import { RefObject } from 'react';
import { GlobalSearchRef } from 'src/components/global-search/GlobalSearch.interfaces';
import { ParaQuery } from 'src/models/paraquery';
import { GlobalComponentProps } from 'src/types/components';

export type ParaQueriesProps = GlobalComponentProps & {
	ref: RefObject<GlobalSearchRef>;
};

export type ParaQueryEditorProps = {
	paraQuery: ParaQuery;
	onParameterChange: (key: string, value: string) => void;
};
