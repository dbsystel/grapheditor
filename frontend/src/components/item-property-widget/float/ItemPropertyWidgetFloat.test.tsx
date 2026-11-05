import i18n from 'src/i18n';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetFloat } from './ItemPropertyWidgetFloat';

describe('Components - ItemPropertyWidgetFloat', () => {
	it('Renders default value "0" in edit mode when nothing is provided', async () => {
		const screen = await render(<ItemPropertyWidgetFloat isEditMode={true} />);

		expect(screen.getByRole('textbox')).toHaveValue('0');
	});

	it('Renders a given valid float value in edit mode', async () => {
		const screen = await render(
			<ItemPropertyWidgetFloat isEditMode={true} defaultValue={3.5} />
		);

		expect(screen.getByRole('textbox')).toHaveValue('3.5');
	});

	it('Shows an invalid message in preview mode when given a completely wrong-type (non-numeric) value', async () => {
		const wrongTypeValue = 'abc' as unknown as number;

		const screen = await render(
			<ItemPropertyWidgetFloat isEditMode={false} defaultValue={wrongTypeValue} />
		);

		expect(
			screen.getByText(
				i18n.t('item_property_widget_float_invalid_message', {
					context: 'with_value',
					value: wrongTypeValue
				})
			)
		).toBeInTheDocument();
	});

	it('Calls onChange with the parsed float value as the user types, normalizing comma to dot', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetFloat isEditMode={true} onChange={onChange} />
		);
		const input = screen.getByRole('textbox');

		await userEvent.fill(input, '12,5');

		expect(onChange).toHaveBeenCalledWith(12.5);
		// GUI keeps the comma as typed, while onChange above received the dot-normalized number
		expect(input).toHaveValue('12,5');
	});

	it('Does not call onChange for a partial decimal value in controlled mode, until a digit completes it', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetFloat isEditMode={true} value={1} onChange={onChange} />
		);
		const input = screen.getByRole('textbox');

		await userEvent.fill(input, '1.');

		expect(onChange).not.toHaveBeenCalled();
		expect(input).toHaveValue('1.');

		await userEvent.fill(input, '1.5');

		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange).toHaveBeenCalledWith(1.5);
	});
});
