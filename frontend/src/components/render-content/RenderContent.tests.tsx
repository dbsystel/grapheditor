import { describe, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { RenderContent } from './RenderContent';

describe('Components RenderContent', () => {
	it('renders correctly', async () => {
		const screen = await render(<RenderContent content="RenderContent" />);

		const heading = screen.getByText('RenderContent');
		expect(heading).toBeInTheDocument();
	});
});
