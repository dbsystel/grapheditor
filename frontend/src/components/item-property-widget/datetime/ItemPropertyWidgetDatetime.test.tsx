import i18n from 'src/i18n';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetDatetime } from './ItemPropertyWidgetDatetime';

describe('Components - ItemPropertyWidgetDatetime', () => {
	it('Renders a valid, non-empty datetime in edit mode by default when nothing is provided', async () => {
		// the default value is the current ISO datetime, which ends in "Z" (UTC); only the date
		// portion is checked here to avoid flakiness from milliseconds/locale-dependent formatting
		const today = new Date().toISOString().split('T')[0];

		const screen = await render(<ItemPropertyWidgetDatetime isEditMode={true} />);
		const datetimeInput = screen
			.getByLabelText(i18n.t('item_property_widget_datetime_label'))
			.element();

		if (!(datetimeInput instanceof HTMLInputElement)) {
			throw new Error('Datetime input is not an HTMLElement');
		}

		expect(datetimeInput.value.startsWith(today)).toBe(true);
		expect(datetimeInput.getAttribute('aria-invalid')).toBe('false');
	});

	it('Renders a given valid datetime value', async () => {
		const value = '2024-05-01T10:15:30.123+02:00';

		const screen = await render(
			<ItemPropertyWidgetDatetime isEditMode={true} defaultValue={value} />
		);

		const datetimeInput = screen.getByLabelText(i18n.t('item_property_widget_datetime_label'));
		expect(datetimeInput).toHaveValue('2024-05-01T10:15:30');

		const fractionInput = screen.getByLabelText(
			i18n.t('item_property_widget_fraction_of_second_label')
		);
		expect(fractionInput).toHaveValue('123');

		const signSelect = screen.getByRole('combobox');
		expect(signSelect).toHaveValue('+');
	});

	it('Shows an invalid message when given a completely wrong-type (non-datetime) value', async () => {
		const wrongTypeValue = 20240501101530 as unknown as string;

		const screen = await render(
			<ItemPropertyWidgetDatetime isEditMode={false} defaultValue={wrongTypeValue} />
		);

		expect(
			screen.getByText(
				i18n.t('item_property_widget_datetime_invalid_message', {
					context: 'with_value',
					value: wrongTypeValue
				})
			)
		).toBeInTheDocument();
	});

	it('Calls onChange with the combined datetime, fraction of second and timezone offset as the user changes them', async () => {
		const onChange = vi.fn();

		// use a deterministic baseline (no fraction/offset) so the assertions below aren't
		// affected by the real current time's own fraction-of-second/timezone values
		const screen = await render(
			<ItemPropertyWidgetDatetime
				isEditMode={true}
				defaultValue="2024-01-01T00:00:00"
				onChange={onChange}
			/>
		);

		const datetimeInput = screen.getByLabelText(i18n.t('item_property_widget_datetime_label'));

		await datetimeInput.fill('2024-05-01T10:15:30');

		expect(onChange).toHaveBeenLastCalledWith('2024-05-01T10:15:30');

		const fractionInput = screen.getByLabelText(
			i18n.t('item_property_widget_fraction_of_second_label')
		);

		await userEvent.type(fractionInput, '5');

		expect(onChange).toHaveBeenLastCalledWith('2024-05-01T10:15:30.5');

		const signSelect = screen.getByRole('combobox');
		const offsetTimeInput = screen.container.querySelector('input[type="time"]');

		if (!offsetTimeInput) {
			throw new Error('Offset time input not found');
		}

		await userEvent.selectOptions(signSelect, '-');

		await userEvent.fill(offsetTimeInput, '05:00');

		expect(onChange).toHaveBeenLastCalledWith('2024-05-01T10:15:30.5-05:00');
	});
});
