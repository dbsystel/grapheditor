import { MouseEvent } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type BreadcrumbsProps = GlobalComponentProps & {
	breadcrumbs: Array<Breadcrumb>;
	activeBreadcrumbIndex?: number;
};

export type Breadcrumb = {
	text: string;
	title?: string;
	onClick?: (event: MouseEvent<HTMLSpanElement>) => void;
};
