import React, { createContext, useContext } from 'react';
import { ItemsDrawerContextType, ItemsDrawerProviderProps } from './ItemsDrawerContext.interfaces';

export const ItemsDrawerContext = createContext<ItemsDrawerContextType>({
	isInsideItemsDrawer: false
});

export const ItemsDrawerProvider = (props: ItemsDrawerProviderProps) => {
	return (
		<ItemsDrawerContext.Provider value={{ isInsideItemsDrawer: !!props.isInsideItemsDrawer }}>
			{props.children}
		</ItemsDrawerContext.Provider>
	);
};

export const useItemsDrawerContext = () => {
	return useContext(ItemsDrawerContext);
};
