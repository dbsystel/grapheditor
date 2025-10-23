import { RefObject } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type GlobalSearchProps = GlobalComponentProps & {
	searchFunctionRef: RefObject<GlobalSearchRef>;
};

export type GlobalSearchRef = {
	triggerSearch: () => void;
};
