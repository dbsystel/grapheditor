import i18n from 'src/i18n';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetDate } from './ItemPropertyWidgetDate';

describe('Components - ItemPropertyWidgetDate', () => {
	it("Renders today's date as the default in edit mode when nothing is provided", async () => {
		const today = new Date().toISOString().split('T')[0];

		const screen = await render(<ItemPropertyWidgetDate isEditMode={true} />);
		const input = screen.getByLabelText(i18n.t('item_property_widget_date_label'));

		expect(input).toHaveValue(today);
	});

	it('Renders a given valid date value in edit mode', async () => {
		const value = '2024-05-01';

		const screen = await render(
			<ItemPropertyWidgetDate isEditMode={true} defaultValue={value} />
		);

		expect(screen.getByLabelText(i18n.t('item_property_widget_date_label'))).toHaveValue(value);
	});

	it('Shows an invalid message when given a completely wrong-type (non-date) value', async () => {
		const wrongTypeValue = 20240501 as unknown as string;

		const screen = await render(
			<ItemPropertyWidgetDate isEditMode={false} defaultValue={wrongTypeValue} />
		);

		expect(
			screen.getByText(
				i18n.t('item_property_widget_date_invalid_message', {
					context: 'with_value',
					value: wrongTypeValue
				})
			)
		).toBeInTheDocument();
	});

	it('Calls onChange with the typed date value as each date segment is completed while typing', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetDate isEditMode={true} onChange={onChange} />
		);
		const input = screen.getByLabelText(i18n.t('item_property_widget_date_label'));

		// native date inputs report an empty string until all segments (year, month, day)
		// have been filled in with a valid value, simulating the user still typing
		await input.fill('');

		expect(onChange).toHaveBeenLastCalledWith('');

		// once the user finishes typing a complete, valid date, the full value is reported
		await input.fill('2024-05-01');

		expect(onChange).toHaveBeenLastCalledWith('2024-05-01');
	});
});
