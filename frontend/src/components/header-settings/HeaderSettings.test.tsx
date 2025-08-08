import { userEvent } from '@vitest/browser/context';
import i18n from 'src/i18n';
import { render } from 'vitest-browser-react';
import { HeaderSettings } from './HeaderSettings';

describe('Components - HeaderSettings', () => {
	test('Render component', () => {
		const screen = render(<HeaderSettings />);

		expect(screen.getByRole('button').element()).toBeInTheDocument();
		expect(screen.getByRole('button').element().getAttribute('data-icon')).toBe('gear_wheel');
		expect(screen.getByRole('article').query()).toBeNull();
	});

	test('Render children', async () => {
		const screen = render(<HeaderSettings />);
		const button = screen.getByRole('button');

		await userEvent.click(button);

		const dropdownMenu = screen.getByRole('article').element();
		const dropdownOptions = dropdownMenu.children[0].children;

		expect(dropdownMenu).toBeInTheDocument();
		expect(dropdownOptions?.length).toBe(3);
		expect(dropdownOptions[0].querySelector('input[type="checkbox"]')).toBeInTheDocument();
		expect(dropdownOptions[0]?.querySelector('label')?.childNodes[1].textContent).toBe(
			i18n.t('autoconnect_label')
		);
	});
});
