import { BreadcrumbEntry } from 'src/components/breadcrumb/Breadcrumb.interfaces';
import { GlobalComponentProps } from 'src/types/components';

export type BreadcrumbsProps = GlobalComponentProps & {
	breadcrumbs: Array<BreadcrumbEntry>;
	activeBreadcrumbIndex?: number;
};
