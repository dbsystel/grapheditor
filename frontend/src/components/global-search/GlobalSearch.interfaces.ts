import { RefObject } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type GlobalSearchProps = GlobalComponentProps & {
	ref: RefObject<GlobalSearchRef>;
};

export type GlobalSearchRef = {
	triggerSearch: () => void;
};
