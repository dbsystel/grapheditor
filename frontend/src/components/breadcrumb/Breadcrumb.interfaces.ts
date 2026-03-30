import { MouseEvent } from 'react';
import { Item } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type BreadcrumbProps = GlobalComponentProps & {
	breadcrumb: BreadcrumbEntry;
	isActive?: boolean;
	shouldRenderDelimiter?: boolean;
};

export type BreadcrumbEntry = {
	item: Item;
	onClick?: (event: MouseEvent<HTMLSpanElement>) => void;
};
