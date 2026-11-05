import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetCartesian2D } from './ItemPropertyWidgetCartesian2D';

describe('Components - ItemPropertyWidgetCartesian2D', () => {
	it('Renders default coordinates {x:0, y:0} in edit mode when nothing is provided', async () => {
		const screen = await render(<ItemPropertyWidgetCartesian2D isEditMode={true} />);

		expect(screen.getByLabelText('X')).toHaveValue('0');
		expect(screen.getByLabelText('Y')).toHaveValue('0');
	});

	it('Renders a given valid {x, y} value in preview mode', async () => {
		const value = { x: 1.5, y: -2.25 };

		const screen = await render(
			<ItemPropertyWidgetCartesian2D isEditMode={false} defaultValue={value} />
		);

		expect(screen.container.textContent).toBe('x:1.5y:-2.25');
	});

	it('Handles a completely wrong-type (non-object) value gracefully in edit mode, falling back to default coordinates', async () => {
		const wrongTypeValue = 'not-an-object' as unknown as { x: number; y: number };

		const screen = await render(
			<ItemPropertyWidgetCartesian2D isEditMode={true} defaultValue={wrongTypeValue} />
		);

		expect(screen.getByLabelText('X')).toHaveValue('0');
		expect(screen.getByLabelText('Y')).toHaveValue('0');
	});

	it('Calls onChange with the updated coordinate object when the X or Y sub-widget changes', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetCartesian2D isEditMode={true} onChange={onChange} />
		);

		const xInput = screen.getByLabelText('X');
		await userEvent.fill(xInput, '3.5');

		expect(onChange).toHaveBeenLastCalledWith({ x: 3.5, y: 0 });

		const yInput = screen.getByLabelText('Y');
		await userEvent.fill(yInput, '-1');

		expect(onChange).toHaveBeenLastCalledWith({ x: 3.5, y: -1 });
	});
});
