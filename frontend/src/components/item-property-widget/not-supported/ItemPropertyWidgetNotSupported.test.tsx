import i18n from 'src/i18n';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetNotSupported } from './ItemPropertyWidgetNotSupported';

describe('Components - ItemPropertyWidgetNotSupported', () => {
	it('Shows an invalid message when nothing (undefined) is provided', async () => {
		const screen = await render(<ItemPropertyWidgetNotSupported defaultValue={undefined} />);

		expect(
			screen.getByText(i18n.t('item_property_widget_not_supported_invalid_message'))
		).toBeInTheDocument();
	});

	it('Renders a valid value as its JSON stringified representation', async () => {
		const screen = await render(<ItemPropertyWidgetNotSupported defaultValue="some value" />);

		expect(screen.getByText(JSON.stringify('some value'))).toBeInTheDocument();
	});

	it('Renders a completely wrong-type value (object) without crashing', async () => {
		const wrongTypeValue = { foo: 'bar', count: 42 };

		const screen = await render(
			<ItemPropertyWidgetNotSupported defaultValue={wrongTypeValue} />
		);

		expect(screen.getByText(JSON.stringify(wrongTypeValue))).toBeInTheDocument();
	});
});
