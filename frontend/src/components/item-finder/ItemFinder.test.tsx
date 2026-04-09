import { testNodes } from 'src/tests/data/nodes';
import { idFormatter } from 'src/utils/id-formatter';
import { describe, expect, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemFinder } from './ItemFinder';

describe('Components - ItemFinder', () => {
	const options = testNodes.slice(0, 3);

	const getInput = (container: Element) => {
		const input = container.querySelector('.item-finder__input input');

		if (!input) {
			throw new Error('Input not found');
		}

		return input;
	};

	test('Render component with label', async () => {
		const screen = await render(<ItemFinder options={options} label="Search nodes" />);

		const input = screen.getByRole('textbox');

		expect(input).toBeInTheDocument();
		expect(screen.getByText('Search nodes')).toBeInTheDocument();
	});

	test('Render dropdown list on input focus', async () => {
		const screen = await render(<ItemFinder options={options} label="Search" />);

		const input = getInput(screen.container);

		await userEvent.click(input);

		await vi.waitFor(() => {
			const listItems = screen.container.querySelectorAll('.item-finder__list-item');

			expect(listItems.length).toBe(options.length);
		});
	});

	test('Display option titles parsed by idFormatter', async () => {
		const screen = await render(<ItemFinder options={options} label="Search" />);

		const input = getInput(screen.container);

		await userEvent.click(input);

		await vi.waitFor(() => {
			options.forEach((option) => {
				const parsedTitle = idFormatter.parseIdToName(option.title);

				expect(screen.getByText(parsedTitle)).toBeInTheDocument();
			});
		});
	});

	test('Call onChange when an option is clicked in single-select mode', async () => {
		const onChangeMock = vi.fn();

		const screen = await render(
			<ItemFinder options={options} label="Search" onChange={onChangeMock} />
		);

		const input = getInput(screen.container);

		await userEvent.click(input);

		await vi.waitFor(() => {
			const listItems = screen.container.querySelectorAll('.item-finder__list-item-content');

			expect(listItems.length).toBeGreaterThan(0);
		});

		const firstItem = screen.container.querySelector('.item-finder__list-item-content');

		if (!firstItem) {
			throw new Error('List item not found');
		}

		await userEvent.click(firstItem);

		expect(onChangeMock).toHaveBeenCalledOnce();
		expect(onChangeMock).toHaveBeenCalledWith(options[0], true, [options[0]]);
	});

	test('Render badges in multiselect mode when option is selected', async () => {
		const screen = await render(
			<ItemFinder
				options={options}
				label="Search"
				isMultiselect={true}
				defaultValue={[options[0], options[1]]}
			/>
		);

		await vi.waitFor(() => {
			const numberOfBadges =
				screen.container.querySelector('.item-finder__badges')?.childElementCount;

			expect(numberOfBadges).toBe(2);
		});
	});

	test('Hide badges when hideBadges prop is true', async () => {
		const screen = await render(
			<ItemFinder
				options={options}
				label="Search"
				isMultiselect={true}
				defaultValue={[options[0]]}
				hideBadges={true}
			/>
		);

		const badges = screen.container.querySelector('.item-finder__badges');

		expect(badges).toBeNull();
	});

	test('Render validMessage when provided', async () => {
		const screen = await render(
			<ItemFinder options={options} label="Search" validMessage="Looks good!" />
		);

		expect(screen.getByText('Looks good!')).toBeInTheDocument();
	});

	test('Render invalidMessage when provided', async () => {
		const screen = await render(
			<ItemFinder options={options} label="Search" invalidMessage="Something went wrong" />
		);

		expect(screen.getByText('Something went wrong')).toBeInTheDocument();
	});

	test('Call onEnterKey with current input value when Enter is pressed', async () => {
		const onEnterKeyMock = vi.fn();

		const screen = await render(
			<ItemFinder
				options={options}
				label="Search"
				onEnterKey={onEnterKeyMock}
				searchTimeoutMilliseconds={0}
			/>
		);

		const input = getInput(screen.container);

		await userEvent.click(input);
		await userEvent.type(input, 'test query');
		await userEvent.keyboard('{Enter}');

		expect(onEnterKeyMock).toHaveBeenCalledOnce();
		expect(onEnterKeyMock).toHaveBeenCalledWith('test query');
	});

	test('Render noInputMatchTooltip data attribute when options are empty and input has value', async () => {
		const tooltipText = 'Press Enter to confirm';

		const screen = await render(
			<ItemFinder
				options={[]}
				label="Search"
				noInputMatchTooltip={tooltipText}
				defaultInputValue="no match"
			/>
		);

		// The tooltip text should be rendered inside the DBTooltip child
		expect(screen.getByText(tooltipText)).toBeInTheDocument();

		// The input should have data-show-confirmation-tooltip="true" because
		// options is empty and internalInputValue is non-empty
		const input = getInput(screen.container);
		expect(input.getAttribute('data-show-confirmation-tooltip')).toBe('true');
	});

	test('Do not activate noInputMatchTooltip when options are present', async () => {
		const tooltipText = 'Press Enter to confirm';

		const screen = await render(
			<ItemFinder
				options={options}
				label="Search"
				noInputMatchTooltip={tooltipText}
				defaultInputValue="some text"
			/>
		);

		// The tooltip text is still rendered in the DOM (inside DBTooltip), but
		// the data attribute should be "false" because options are available
		const input = getInput(screen.container);

		expect(input.getAttribute('data-show-confirmation-tooltip')).toBe('false');
	});

	test('Disable the input when isDisabled is true', async () => {
		const screen = await render(
			<ItemFinder options={options} label="Search" isDisabled={true} />
		);

		const input = getInput(screen.container);

		expect(input.getAttribute('disabled')).not.toBeNull();
	});
});
