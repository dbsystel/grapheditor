import i18n from 'src/i18n';
import { safeStringify } from 'src/utils/helpers/general';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetString } from './ItemPropertyWidgetString';

describe('Components - ItemPropertyWidgetString', () => {
	it('Renders an empty default value in edit mode when nothing is provided', async () => {
		const screen = await render(<ItemPropertyWidgetString isEditMode={true} />);
		const textarea = screen.getByRole('textbox');

		expect(textarea).toHaveValue('');
	});

	it('Renders a given valid string value in edit mode', async () => {
		const value = 'hello world';

		const screen = await render(
			<ItemPropertyWidgetString isEditMode={true} defaultValue={value} />
		);

		expect(screen.getByRole('textbox')).toHaveValue(value);
	});

	it('Shows an invalid message in preview mode when given a completely wrong-type (non-string) value', async () => {
		const wrongTypeValue = 42 as unknown as string;

		const screen = await render(
			<ItemPropertyWidgetString isEditMode={false} defaultValue={wrongTypeValue} />
		);

		expect(
			screen.getByText(
				i18n.t('item_property_widget_string_invalid_message', {
					context: 'with_value',
					value: safeStringify(wrongTypeValue)
				})
			)
		).toBeInTheDocument();
	});

	it('Calls onChange with the typed text as the user types', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetString isEditMode={true} onChange={onChange} />
		);
		const textarea = screen.getByRole('textbox');

		await userEvent.type(textarea, 'abc');

		expect(onChange).toHaveBeenCalledTimes(3);
		expect(onChange).toHaveBeenNthCalledWith(1, 'a');
		expect(onChange).toHaveBeenNthCalledWith(2, 'ab');
		expect(onChange).toHaveBeenNthCalledWith(3, 'abc');
	});
});
