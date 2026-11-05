import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetCartesian3D } from './ItemPropertyWidgetCartesian3D';

describe('Components - ItemPropertyWidgetCartesian3D', () => {
	it('Renders default coordinates {x:0, y:0, z:0} in edit mode when nothing is provided', async () => {
		const screen = await render(<ItemPropertyWidgetCartesian3D isEditMode={true} />);

		expect(screen.getByLabelText('X')).toHaveValue('0');
		expect(screen.getByLabelText('Y')).toHaveValue('0');
		expect(screen.getByLabelText('Z')).toHaveValue('0');
	});

	it('Renders a given valid {x, y, z} value in preview mode', async () => {
		const value = { x: 1.5, y: -2.25, z: 10 };

		const screen = await render(
			<ItemPropertyWidgetCartesian3D isEditMode={false} defaultValue={value} />
		);

		expect(screen.container.textContent).toBe('x:1.5y:-2.25z:10');
	});

	it('Handles a completely wrong-type (non-object) value gracefully in edit mode, falling back to default coordinates', async () => {
		const wrongTypeValue = 'not-an-object' as unknown as { x: number; y: number; z: number };

		const screen = await render(
			<ItemPropertyWidgetCartesian3D isEditMode={true} defaultValue={wrongTypeValue} />
		);

		expect(screen.getByLabelText('X')).toHaveValue('0');
		expect(screen.getByLabelText('Y')).toHaveValue('0');
		expect(screen.getByLabelText('Z')).toHaveValue('0');
	});

	it('Calls onChange with the updated coordinate object when the X, Y or Z sub-widget changes', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetCartesian3D isEditMode={true} onChange={onChange} />
		);

		await userEvent.fill(screen.getByLabelText('X'), '3.5');
		expect(onChange).toHaveBeenLastCalledWith({ x: 3.5, y: 0, z: 0 });

		await userEvent.fill(screen.getByLabelText('Y'), '-1');
		expect(onChange).toHaveBeenLastCalledWith({ x: 3.5, y: -1, z: 0 });

		await userEvent.fill(screen.getByLabelText('Z'), '7');
		expect(onChange).toHaveBeenLastCalledWith({ x: 3.5, y: -1, z: 7 });
	});
});
