import i18n from 'src/i18n';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { HeaderSettings } from './HeaderSettings';

describe('Components - HeaderSettings', () => {
	test('Render component', async () => {
		const screen = await render(<HeaderSettings />);

		expect(screen.getByRole('button').element()).toBeInTheDocument();
		expect(screen.getByRole('button').element().getAttribute('data-icon')).toBe('gear_wheel');
		expect(screen.getByRole('article').query()).toBeNull();
	});

	test('Render children', async () => {
		const screen = await render(<HeaderSettings />);
		const button = screen.getByRole('button');

		await userEvent.click(button);

		const settingsArticleLocator = screen.getByRole('article');

		// the popover content is present in the DOM right away, but it's only exposed via the
		// "article" role once the popover has actually finished opening (positioning/animation
		// can take a tick) - wait for that instead of asserting synchronously right after the click
		await expect.element(settingsArticleLocator).toBeInTheDocument();

		const settingsArticle = settingsArticleLocator.element();
		const settings = settingsArticle.children[0].children;

		expect(settings?.length).toBe(7);
		expect(settings[0].querySelector('input[type="checkbox"]')).toBeInTheDocument();
		expect(settings[0]?.querySelector('label')?.childNodes[1].textContent).toBe(
			i18n.t('autoconnect_label')
		);
	});
});
