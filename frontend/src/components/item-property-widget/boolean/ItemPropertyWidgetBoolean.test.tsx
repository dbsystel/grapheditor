import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetBoolean } from './ItemPropertyWidgetBoolean';

describe('Components - ItemPropertyWidgetBoolean', () => {
	it('Renders unchecked by default in edit mode when nothing is provided', async () => {
		const screen = await render(<ItemPropertyWidgetBoolean isEditMode={true} />);
		const checkbox = screen.getByRole('checkbox');

		expect(checkbox).not.toBeChecked();
		expect(checkbox).toBeEnabled();
	});

	it('Renders a given valid boolean value as checked in edit mode', async () => {
		const screen = await render(
			<ItemPropertyWidgetBoolean isEditMode={true} defaultValue={true} />
		);
		const checkbox = screen.getByRole('checkbox');

		expect(checkbox).toBeChecked();
	});

	it('Marks the checkbox as unchecked when given a completely wrong-type (non-boolean) value', async () => {
		const screen = await render(
			<ItemPropertyWidgetBoolean
				isEditMode={false}
				defaultValue={'true' as unknown as boolean}
			/>
		);
		const checkbox = screen.getByRole('checkbox');

		expect(checkbox).not.toBeChecked();
	});

	it('Calls onChange with the toggled boolean value when the checkbox is clicked', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetBoolean isEditMode={true} defaultValue={false} onChange={onChange} />
		);
		const checkbox = screen.getByRole('checkbox');

		await userEvent.click(checkbox);

		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange).toHaveBeenCalledWith(true);
	});
});
