import { PropsWithChildren } from 'react';

export type ItemsDrawerProviderProps = PropsWithChildren & {
	isInsideItemsDrawer?: boolean;
};

export type ItemsDrawerContextType = {
	isInsideItemsDrawer: boolean;
};
