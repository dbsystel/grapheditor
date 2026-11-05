import i18n from 'src/i18n';
import { ItemPropertyShapeNonList } from 'src/models/item';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemPropertyWidgetList } from './ItemPropertyWidgetList';

describe('Components - ItemPropertyWidgetList', () => {
	it('Renders the empty-list controls in edit mode when nothing is provided', async () => {
		const screen = await render(<ItemPropertyWidgetList isEditMode={true} />);

		expect(screen.getByRole('combobox')).toBeInTheDocument();
		expect(screen.getByText(i18n.t('item_property_widget_list_apply'))).toBeInTheDocument();
	});

	it('Renders a given valid list of properties in edit mode', async () => {
		const value: Array<ItemPropertyShapeNonList> = [
			{ type: 'string', value: 'first', edit: true },
			{ type: 'string', value: 'second', edit: true }
		];

		const screen = await render(
			<ItemPropertyWidgetList isEditMode={true} defaultValue={value} />
		);
		const textareas = screen
			.getByRole('textbox')
			.elements()
			.filter((element) => element instanceof HTMLTextAreaElement);

		expect(textareas.length).toBe(2);
		expect(textareas[0].value).toBe('first');
		expect(textareas[1].value).toBe('second');
	});

	it('Shows an invalid message in preview mode when the list contains inconsistent (wrong-shape) item types', async () => {
		const value: Array<ItemPropertyShapeNonList> = [
			{ type: 'string', value: 'a', edit: true },
			{ type: 'integer', value: 1, edit: true }
		];

		const screen = await render(
			<ItemPropertyWidgetList isEditMode={false} defaultValue={value} />
		);

		expect(
			screen.getByText(i18n.t('item_property_widget_list_invalid_message'))
		).toBeInTheDocument();
	});

	it('Calls onChange with the updated list when a property is added and then removed', async () => {
		const onChange = vi.fn();

		const screen = await render(
			<ItemPropertyWidgetList isEditMode={true} onChange={onChange} />
		);

		const applyButton = screen.getByRole('button', {
			name: i18n.t('item_property_widget_list_apply')
		});

		await userEvent.click(applyButton);

		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenLastCalledWith([{ type: 'string', value: '', edit: true }]);

		// adding a second property via the "+" button re-uses the existing (first) item's type
		const addButtonIndex = screen
			.getByRole('button')
			.elements()
			.findIndex((button) => button.getAttribute('data-icon') === 'plus');

		if (addButtonIndex === -1) {
			throw new Error('Could not find add button');
		}

		await userEvent.click(screen.getByRole('button').nth(addButtonIndex));

		expect(onChange).toHaveBeenCalledTimes(2);
		expect(onChange).toHaveBeenLastCalledWith([
			{ type: 'string', value: '', edit: true },
			{ type: 'string', value: '', edit: true }
		]);

		// remove the first item via its delete ("bin") button, keeping only the second one
		const firstDeleteButtonIndex = screen
			.getByRole('button')
			.elements()
			.findIndex((button) => button.getAttribute('data-icon') === 'bin');

		if (firstDeleteButtonIndex === -1) {
			throw new Error('Could not find delete button');
		}

		await userEvent.click(screen.getByRole('button').nth(firstDeleteButtonIndex));

		expect(onChange).toHaveBeenCalledTimes(3);
		expect(onChange).toHaveBeenLastCalledWith([{ type: 'string', value: '', edit: true }]);
	});
});
