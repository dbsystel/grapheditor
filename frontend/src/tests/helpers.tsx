import { act, ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ItemsDrawer } from 'src/components/items-drawer/ItemsDrawer';
import { FormItemProperty } from 'src/models/general';
import { ItemProperty } from 'src/models/item';
import { render } from 'vitest-browser-react';

export const renderWithRouter = (component: ReactElement) => {
	return render(component, { wrapper: BrowserRouter });
};

export const renderWithDrawer = (component: ReactElement) => {
	return render(null, {
		wrapper: () => (
			<div>
				{component}
				<ItemsDrawer />
			</div>
		)
	});
};

// resolve pending promises
export const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

// Test first render and componentDidMount
export const componentRender = async () => {
	await act(async () => {
		await flushPromises();
	});
};

export const generateTestProperty = (id: string): ItemProperty => {
	return {
		edit: true,
		value: id + '-value',
		type: 'string'
	};
};

export const generateFormItemProperty = (key: string): FormItemProperty => {
	return {
		key: key,
		value: key + '-value',
		type: 'string'
	};
};
