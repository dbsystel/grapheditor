import { RefObject } from 'react';
import { GlobalSearchRef } from 'src/components/global-search/GlobalSearch.interfaces';
import { GlobalComponentProps } from 'src/types/components';

export type ParaQueriesProps = GlobalComponentProps & {
	searchFunctionRef: RefObject<GlobalSearchRef>;
};
