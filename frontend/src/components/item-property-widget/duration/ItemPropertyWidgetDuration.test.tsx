import i18n from 'src/i18n';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetDuration } from './ItemPropertyWidgetDuration';

describe('Components - ItemPropertyWidgetDuration', () => {
	it('Renders default duration "P1DT0H" in edit mode when nothing is provided', async () => {
		const screen = await render(<ItemPropertyWidgetDuration isEditMode={true} />);

		expect(screen.getByRole('textbox')).toHaveValue('P1DT0H');
	});

	it('Renders a given valid duration value in edit mode', async () => {
		const screen = await render(
			<ItemPropertyWidgetDuration isEditMode={true} defaultValue="P3Y6M4DT12H30M5S" />
		);

		expect(screen.getByRole('textbox')).toHaveValue('P3Y6M4DT12H30M5S');
	});

	it('Shows an invalid message in preview mode when given a completely wrong-type value', async () => {
		const wrongTypeValue = 42 as unknown as string;

		const screen = await render(
			<ItemPropertyWidgetDuration isEditMode={false} defaultValue={wrongTypeValue} />
		);

		expect(
			screen.getByText(
				i18n.t('item_property_widget_duration_invalid_message', {
					context: 'with_value',
					value: wrongTypeValue
				})
			)
		).toBeInTheDocument();
	});

	it('Calls onChange with the typed value when valid, falls back to the default when invalid, and resets when emptied on blur', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetDuration isEditMode={true} onChange={onChange} />
		);
		const input = screen.getByRole('textbox');

		await userEvent.fill(input, 'P2D');

		expect(onChange).toHaveBeenLastCalledWith('P2D');

		await userEvent.fill(input, 'not-a-duration');

		expect(onChange).toHaveBeenLastCalledWith('P1DT0H');

		await userEvent.fill(input, '');
		await userEvent.tab();

		expect(input).toHaveValue('P1DT0H');
	});
});
