import { userEvent } from '@vitest/browser/context';
import i18n from 'src/i18n';
import { expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { ErrorBoundary } from './ErrorBoundary';

describe('Components - ErrorBoundary', () => {
	const errorComponentChildText = 'Happy little div';

	const ReferenceErrorComponent = () => {
		if (triggerError) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			return <div>{(fakeObject as never).property}</div>;
		} else {
			return <div>{errorComponentChildText}</div>;
		}
	};
	let triggerError = true;

	test('Render component', () => {
		const screen = render(
			<div data-testid="error-boundary-wrapper">
				<ErrorBoundary testId="error-boundary-wrapper" />
			</div>
		);

		const errorBoundaryWrapper = screen.getByTestId('error-boundary-wrapper');

		expect(errorBoundaryWrapper.element()).toBeEmptyDOMElement();
	});

	test('Catch reference error + reload component', async () => {
		// mute console error
		vi.spyOn(console, 'error').mockImplementationOnce(() => null);

		const screen = render(
			<div data-testid="error-boundary-wrapper">
				<ErrorBoundary testId="error-boundary-wrapper">
					<ReferenceErrorComponent />
				</ErrorBoundary>
			</div>
		);

		const errorBoundaryWrapper = screen.getByTestId('error-boundary-wrapper');
		const exclamationMarkIcon = errorBoundaryWrapper
			.element()
			.querySelector('[data-icon="exclamation_mark_circle"]');

		const reloadButton = screen.getByRole('button').element();
		const errorMessage = screen.getByText(i18n.t('something_went_wrong'));

		expect(errorBoundaryWrapper.element()).not.toBeEmptyDOMElement();
		expect(exclamationMarkIcon).toBeVisible();
		expect(errorMessage).toBeVisible();
		expect(reloadButton).toBeVisible();

		triggerError = false;

		/* 
			This is a quickfix until this ticket is resolved: 
			https://github.com/db-ux-design-system/core-web/issues/4400
		*/
		await userEvent.hover(screen.getByRole('button'));

		setTimeout(async () => {
			await userEvent.click(screen.getByRole('button'));
			expect(screen.getByText(errorComponentChildText)).toBeVisible();
		}, 10);
	});
});
