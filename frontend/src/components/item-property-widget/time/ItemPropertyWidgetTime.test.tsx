import i18n from 'src/i18n';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetTime } from './ItemPropertyWidgetTime';

describe('Components - ItemPropertyWidgetTime', () => {
	it('Renders default time "00:00:00" in edit mode when nothing is provided', async () => {
		const screen = await render(<ItemPropertyWidgetTime isEditMode={true} />);
		const timeInput = screen.getByLabelText(i18n.t('item_property_widget_time_label'));

		expect(timeInput).toHaveValue('00:00:00');
	});

	it('Renders a given valid time value', async () => {
		const value = '14:30:00+02:00';

		const screen = await render(
			<ItemPropertyWidgetTime isEditMode={true} defaultValue={value} />
		);
		const timeInput = screen.getByLabelText(i18n.t('item_property_widget_time_label'));

		expect(timeInput).toHaveValue('14:30:00');
	});

	it('Shows an invalid message when given a completely wrong-type (non-time) value', async () => {
		const wrongTypeValue = 143000 as unknown as string;

		const screen = await render(
			<ItemPropertyWidgetTime isEditMode={false} defaultValue={wrongTypeValue} />
		);

		expect(
			screen.getByText(
				i18n.t('item_property_widget_time_invalid_message', {
					context: 'with_value',
					value: wrongTypeValue
				})
			)
		).toBeInTheDocument();
	});

	it('Calls onChange with the combined time and timezone offset as the user changes them', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetTime isEditMode={true} onChange={onChange} />
		);
		const timeInput = screen.getByLabelText(i18n.t('item_property_widget_time_label'));

		await timeInput.fill('09:15:00');

		expect(onChange).toHaveBeenLastCalledWith('09:15:00+00:00');

		const signSelect = screen.getByRole('combobox');

		await userEvent.selectOptions(signSelect, '-');

		expect(onChange).toHaveBeenLastCalledWith('09:15:00-00:00');
	});
});
