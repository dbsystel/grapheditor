import { PropsWithChildren } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type LoadingProps = GlobalComponentProps &
	PropsWithChildren<{
		isLoading: boolean;
		// wrap children with our component all the time
		wrapChildren?: boolean;
		// render loading text or children while loading
		renderChildrenWhileLoading?: boolean;
	}>;
