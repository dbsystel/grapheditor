import i18n from 'src/i18n';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetTimezoneOffset } from './ItemPropertyWidgetTimezoneOffset';

describe('Components - ItemPropertyWidgetTimezoneOffset', () => {
	it('Renders empty sign/time in edit mode when nothing is provided', async () => {
		const screen = await render(<ItemPropertyWidgetTimezoneOffset isEditMode={true} />);
		const signSelect = screen.getByRole('combobox');
		const timeInput = screen.getByRole('textbox');

		expect(signSelect).toHaveValue('');
		expect(timeInput).toHaveValue('');
	});

	it('Renders a given valid offset value in edit mode', async () => {
		const screen = await render(
			<ItemPropertyWidgetTimezoneOffset
				isEditMode={true}
				defaultValue={{ sign: '+', time: '02:00' }}
			/>
		);
		const signSelect = screen.getByRole('combobox');
		const timeInput = screen.getByRole('textbox');

		expect(signSelect).toHaveValue('+');
		expect(timeInput).toHaveValue('02:00');
	});

	it('Shows an invalid message in preview mode when given an out-of-range offset value', async () => {
		const wrongValue = { sign: '+', time: '15:00' };

		const screen = await render(
			<ItemPropertyWidgetTimezoneOffset isEditMode={false} defaultValue={wrongValue} />
		);

		expect(
			screen.getByText(
				i18n.t('item_property_widget_timezone_offset_invalid_message', {
					context: 'with_value',
					value: wrongValue.sign + wrongValue.time
				})
			)
		).toBeInTheDocument();
	});

	it('Calls onChange with the updated sign and time as the user interacts with the inputs', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetTimezoneOffset
				isEditMode={true}
				defaultValue={{ sign: '+', time: '02:00' }}
				onChange={onChange}
			/>
		);
		const signSelect = screen.getByRole('combobox');
		const timeInput = screen.getByRole('textbox');

		await userEvent.selectOptions(signSelect, '-');

		expect(onChange).toHaveBeenLastCalledWith({ sign: '-', time: '02:00' });

		await userEvent.fill(timeInput, '05:30');

		expect(onChange).toHaveBeenLastCalledWith({ sign: '-', time: '05:30' });
	});
});
