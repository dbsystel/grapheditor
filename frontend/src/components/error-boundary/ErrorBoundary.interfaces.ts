import { PropsWithChildren } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type ErrorBoundaryProps = PropsWithChildren & GlobalComponentProps;

export type ErrorBoundaryState = {
	hasError: boolean;
};
