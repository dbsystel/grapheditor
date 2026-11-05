import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetWgs842D } from './ItemPropertyWidgetWgs842D';

describe('Components - ItemPropertyWidgetWgs842D', () => {
	it('Renders default coordinates {latitude:0, longitude:0} in edit mode when nothing is provided', async () => {
		const screen = await render(<ItemPropertyWidgetWgs842D isEditMode={true} />);

		expect(screen.getByLabelText('Latitude')).toHaveValue('0');
		expect(screen.getByLabelText('Longitude')).toHaveValue('0');
	});

	it('Renders a given valid {latitude, longitude} value in preview mode', async () => {
		const value = { latitude: 52.52, longitude: 13.405 };

		const screen = await render(
			<ItemPropertyWidgetWgs842D isEditMode={false} defaultValue={value} />
		);

		expect(screen.container.textContent).toBe('latitude:52.52longitude:13.405');
	});

	it('Handles a completely wrong-type (non-object) value gracefully in edit mode, falling back to default coordinates', async () => {
		const wrongTypeValue = 'not-an-object' as unknown as {
			latitude: number;
			longitude: number;
		};

		const screen = await render(
			<ItemPropertyWidgetWgs842D isEditMode={true} defaultValue={wrongTypeValue} />
		);

		expect(screen.getByLabelText('Latitude')).toHaveValue('0');
		expect(screen.getByLabelText('Longitude')).toHaveValue('0');
	});

	it('Calls onChange with the updated coordinate object when the Latitude or Longitude sub-widget changes', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetWgs842D isEditMode={true} onChange={onChange} />
		);

		await userEvent.fill(screen.getByLabelText('Latitude'), '52.52');
		expect(onChange).toHaveBeenLastCalledWith({ latitude: 52.52, longitude: 0 });

		await userEvent.fill(screen.getByLabelText('Longitude'), '13.405');
		expect(onChange).toHaveBeenLastCalledWith({ latitude: 52.52, longitude: 13.405 });
	});
});
