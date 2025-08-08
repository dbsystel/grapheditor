import { Breadcrumb } from 'src/components/breadcrumbs/Breadcrumbs.interfaces';
import { GlobalComponentProps } from 'src/types/components';

export type ItemsDrawerProps = GlobalComponentProps;

export type DrawerHeadProps = {
	breadcrumbs: Array<Breadcrumb>;
	onClose: () => void;
};
