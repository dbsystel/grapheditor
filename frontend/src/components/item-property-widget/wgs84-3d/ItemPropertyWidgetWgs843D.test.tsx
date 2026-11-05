import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetWgs843D } from './ItemPropertyWidgetWgs843D';

describe('Components - ItemPropertyWidgetWgs843D', () => {
	it('Renders default coordinates {latitude:0, longitude:0, height:0} in edit mode when nothing is provided', async () => {
		const screen = await render(<ItemPropertyWidgetWgs843D isEditMode={true} />);

		expect(screen.getByLabelText('Latitude')).toHaveValue('0');
		expect(screen.getByLabelText('Longitude')).toHaveValue('0');
		expect(screen.getByLabelText('Height')).toHaveValue('0');
	});

	it('Renders a given valid {latitude, longitude, height} value in preview mode', async () => {
		const value = { latitude: 52.52, longitude: 13.405, height: 34 };

		const screen = await render(
			<ItemPropertyWidgetWgs843D isEditMode={false} defaultValue={value} />
		);

		expect(screen.container.textContent).toBe('latitude:52.52longitude:13.405height:34');
	});

	it('Handles a completely wrong-type (non-object) value gracefully in edit mode, falling back to default coordinates', async () => {
		const wrongTypeValue = 'not-an-object' as unknown as {
			latitude: number;
			longitude: number;
			height: number;
		};

		const screen = await render(
			<ItemPropertyWidgetWgs843D isEditMode={true} defaultValue={wrongTypeValue} />
		);

		expect(screen.getByLabelText('Latitude')).toHaveValue('0');
		expect(screen.getByLabelText('Longitude')).toHaveValue('0');
		expect(screen.getByLabelText('Height')).toHaveValue('0');
	});

	it('Calls onChange with the updated coordinate object when the Latitude, Longitude or Height sub-widget changes', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetWgs843D isEditMode={true} onChange={onChange} />
		);

		await userEvent.fill(screen.getByLabelText('Latitude'), '52.52');
		expect(onChange).toHaveBeenLastCalledWith({ latitude: 52.52, longitude: 0, height: 0 });

		await userEvent.fill(screen.getByLabelText('Longitude'), '13.405');
		expect(onChange).toHaveBeenLastCalledWith({
			latitude: 52.52,
			longitude: 13.405,
			height: 0
		});

		await userEvent.fill(screen.getByLabelText('Height'), '34');
		expect(onChange).toHaveBeenLastCalledWith({
			latitude: 52.52,
			longitude: 13.405,
			height: 34
		});
	});
});
