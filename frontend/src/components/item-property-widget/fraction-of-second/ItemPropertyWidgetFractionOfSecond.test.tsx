import i18n from 'src/i18n';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetFractionOfSecond } from './ItemPropertyWidgetFractionOfSecond';

describe('Components - ItemPropertyWidgetFractionOfSecond', () => {
	it('Renders an empty default value in edit mode when nothing is provided', async () => {
		const screen = await render(<ItemPropertyWidgetFractionOfSecond isEditMode={true} />);

		expect(screen.getByRole('textbox')).toHaveValue('');
	});

	it('Renders a given valid value in edit mode', async () => {
		const value = '123';

		const screen = await render(
			<ItemPropertyWidgetFractionOfSecond isEditMode={true} defaultValue={value} />
		);

		expect(screen.getByRole('textbox')).toHaveValue(value);
	});

	it('Shows an invalid message in preview mode when given a completely wrong-type (non-numeric) value', async () => {
		const wrongTypeValue = 'abc';

		const screen = await render(
			<ItemPropertyWidgetFractionOfSecond isEditMode={false} defaultValue={wrongTypeValue} />
		);

		expect(
			screen.getByText(
				i18n.t('item_property_widget_fraction_of_second_invalid_message', {
					context: 'with_value',
					value: wrongTypeValue
				})
			)
		).toBeInTheDocument();
	});

	it('Calls onChange with the typed digits, and ignores non-digit characters', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetFractionOfSecond isEditMode={true} onChange={onChange} />
		);
		const input = screen.getByRole('textbox');

		await userEvent.type(input, '12');

		expect(onChange).toHaveBeenCalledTimes(2);
		expect(onChange).toHaveBeenNthCalledWith(1, '1');
		expect(onChange).toHaveBeenNthCalledWith(2, '12');

		onChange.mockClear();

		await userEvent.type(input, 'a');

		expect(onChange).not.toHaveBeenCalled();
	});
});
