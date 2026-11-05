import { CustomSelectOptionType } from '@db-ux/react-core-components/dist/components/custom-select/model';
import { useState } from 'react';
import { expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ComboBox } from './ComboBox';

describe('Components - ComboBox', () => {
	const options: Array<CustomSelectOptionType> = [
		{ value: 'alpha', label: 'Alpha' },
		{ value: 'bravo', label: 'Bravo' },
		{ value: 'charlie', label: 'Charlie' }
	];

	test('Render component', async () => {
		const screen = await render(<ComboBox options={options} />);

		expect(screen.getByRole('textbox').element()).toBeInTheDocument();
		// the dropdown is closed until the input is focused/typed into
		expect(screen.getByRole('radio').query()).toBeNull();
	});

	test('Only options provided (no value): selecting an option marks it as selected and updates the input text', async () => {
		const onChange = vi.fn();
		const screen = await render(<ComboBox options={options} onChange={onChange} />);
		const input = screen.getByRole('textbox');

		// open the dropdown
		await userEvent.click(input);

		// the native radio input is visually hidden by the custom styling and
		// overlaps its own label, which breaks Playwright's pointer-based
		// actionability checks (it can't find a stable visible target to click).
		// Dispatch a real native click on the <label> instead - the browser's
		// built-in label-to-control forwarding still toggles the radio correctly.
		const bravoLabel = screen.getByText('Bravo').element().closest('label');

		if (!bravoLabel) {
			throw new Error('Could not find the <label> wrapping the "Bravo" option');
		}

		bravoLabel.click();

		// "onChange" fires with the selected option's value and the full option object
		await vi.waitFor(() => {
			expect(onChange).toHaveBeenCalledWith('bravo', options[1]);
		});
		// the dropdown closes after a selection and the input reflects the chosen label
		await expect.element(input).toHaveValue('Bravo');

		// reopen the dropdown and confirm the matching option is the one marked as selected.
		// note: since "inputText" is now "Bravo", the list filters down to just that single
		// matching option (typeahead behavior), so there is nothing else left to assert as "unchecked"
		await userEvent.click(input);

		await expect.element(screen.getByLabelText('Bravo')).toBeChecked();
	});

	test('Changing both "value" and "options" props together reflects the UI', async () => {
		const optionsA: Array<CustomSelectOptionType> = [
			{ value: 'a1', label: 'A One' },
			{ value: 'a2', label: 'A Two' }
		];
		const optionsB: Array<CustomSelectOptionType> = [
			{ value: 'b1', label: 'B One' },
			{ value: 'b2', label: 'B Two' }
		];

		const screen = await render(<ComboBox options={optionsA} value="a1" />);
		const input = screen.getByRole('textbox');

		expect(input.element()).toHaveValue('A One');

		await screen.rerender(<ComboBox options={optionsB} value="b2" />);

		// input text is re-derived from the NEW options list for the NEW value
		await expect.element(input).toHaveValue('B Two');

		// the matching option from the new options list is the one marked as selected
		await userEvent.click(input);

		await expect.element(screen.getByLabelText('B Two')).toBeChecked();
	});

	test('Typing free text that does not match any option is preserved, even when the parent echoes it back via "value"', async () => {
		// mirrors how a real parent (e.g. ParaQueryEditor) round-trips typed text
		// back in as "value" on every keystroke
		const Harness = () => {
			const [value, setValue] = useState<string | undefined>('alpha');

			return (
				<ComboBox
					options={options}
					value={value}
					onInputChange={(text) => setValue(text)}
					onChange={(optionValue) => setValue(optionValue)}
				/>
			);
		};

		const screen = await render(<Harness />);
		const input = screen.getByRole('textbox');

		await userEvent.click(input);
		await userEvent.clear(input);
		await userEvent.type(input, 'z');

		// should stay "z" instead of being cleared back to an empty string
		await expect.element(input).toHaveValue('z');
	});

	test('Filters the dropdown list based on the typed text', async () => {
		const screen = await render(<ComboBox options={options} />);
		const input = screen.getByRole('textbox');

		await userEvent.click(input);
		await userEvent.type(input, 'bra');

		await expect.element(screen.getByText('Bravo')).toBeInTheDocument();
		expect(screen.getByText('Alpha').query()).toBeNull();
		expect(screen.getByText('Charlie').query()).toBeNull();
	});

	test('Shows the "no results" message when no option matches the typed text', async () => {
		const screen = await render(<ComboBox options={options} noResultsText="Nothing found" />);
		const input = screen.getByRole('textbox');

		await userEvent.click(input);
		await userEvent.type(input, 'zzz-no-match');

		await expect.element(screen.getByText('Nothing found')).toBeInTheDocument();
		expect(screen.getByRole('radio').query()).toBeNull();
	});

	test('Fires "onInputChange" with the raw typed text on every keystroke', async () => {
		const onInputChange = vi.fn();
		const screen = await render(<ComboBox options={options} onInputChange={onInputChange} />);
		const input = screen.getByRole('textbox');

		await userEvent.click(input);
		await userEvent.type(input, 'ab');

		expect(onInputChange).toHaveBeenCalledWith('a');
		expect(onInputChange).toHaveBeenCalledWith('ab');
	});
});
