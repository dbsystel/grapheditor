import { useLoadingRequestsStore } from 'src/stores/loading-requests';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { ApplicationLoadingIndicator } from './ApplicationLoadingIndicator';

describe('Components ApplicationLoadingIndicator', () => {
	afterEach(() => {
		useLoadingRequestsStore.getState().reset();
	});

	it('renders root element without loading class when there are no loading actions', async () => {
		const screen = await render(<ApplicationLoadingIndicator testId="ali" />);
		const root = screen.getByTestId('ali');

		expect(root).toBeTruthy();
		expect(root.element().className).toContain('application-loading-indicator');
		expect(root.element().className).not.toContain('application-loading-indicator--loading');
	});

	it('applies loading class when minimum progress is between 1 and 99', async () => {
		useLoadingRequestsStore.setState({
			loadingRequests: [
				{ id: 'a', progress: 80 },
				{ id: 'b', progress: 25 },
				{ id: 'c', progress: 60 }
			]
		});

		const screen = await render(<ApplicationLoadingIndicator testId="ali" />);
		const root = screen.getByTestId('ali');

		// min(80,25,60)=25 => loading class should be present
		expect(root.element().className).toContain('application-loading-indicator--loading');
	});

	it('does not apply loading class when minimum progress is 100', async () => {
		useLoadingRequestsStore.setState({
			loadingRequests: [
				{ id: 'a', progress: 100 },
				{ id: 'b', progress: 100 }
			]
		});

		const screen = await render(<ApplicationLoadingIndicator testId="ali" />);
		const root = screen.getByTestId('ali');

		expect(root.element().className).not.toContain('application-loading-indicator--loading');

		// effect should clear finished actions when loadingIndicator === 100
		await Promise.resolve();
		expect(useLoadingRequestsStore.getState().loadingRequests).toEqual([]);
	});

	it('uses minimum progress across actions (not max/avg) to determine loading state', async () => {
		useLoadingRequestsStore.setState({
			loadingRequests: [
				{ id: 'a', progress: 100 },
				{ id: 'b', progress: 1 }
			]
		});

		const screen = await render(<ApplicationLoadingIndicator testId="ali" />);
		const root = screen.getByTestId('ali');

		// If min is used, class is loading (1)
		expect(root.element().className).toContain('application-loading-indicator--loading');
	});
});
