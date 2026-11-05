import i18n from 'src/i18n';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetInteger } from './ItemPropertyWidgetInteger';

describe('Components - ItemPropertyWidgetInteger', () => {
	it('Renders default value "0" in edit mode when nothing is provided', async () => {
		const screen = await render(<ItemPropertyWidgetInteger isEditMode={true} />);

		expect(screen.getByRole('textbox')).toHaveValue('0');
	});

	it('Renders a given valid integer value in edit mode', async () => {
		const screen = await render(
			<ItemPropertyWidgetInteger isEditMode={true} defaultValue={42} />
		);

		expect(screen.getByRole('textbox')).toHaveValue('42');
	});

	it('Shows an invalid message in preview mode when given a completely wrong-type (non-numeric) value', async () => {
		const wrongTypeValue = 'not-a-number' as unknown as number;

		const screen = await render(
			<ItemPropertyWidgetInteger isEditMode={false} defaultValue={wrongTypeValue} />
		);

		expect(
			screen.getByText(
				i18n.t('item_property_widget_integer_invalid_message', {
					context: 'with_value',
					value: wrongTypeValue
				})
			)
		).toBeInTheDocument();
	});

	it('Calls onChange with the parsed integer as valid digits are typed, and ignores non-digit characters', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetInteger isEditMode={true} onChange={onChange} />
		);
		const input = screen.getByRole('textbox');

		await userEvent.type(input, '123');

		expect(onChange).toHaveBeenCalledTimes(3);
		expect(onChange).toHaveBeenNthCalledWith(1, 1);
		expect(onChange).toHaveBeenNthCalledWith(2, 12);
		expect(onChange).toHaveBeenNthCalledWith(3, 123);

		onChange.mockClear();

		await userEvent.type(input, 'x');

		expect(onChange).not.toHaveBeenCalled();
	});
});
