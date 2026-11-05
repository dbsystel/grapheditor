import { CustomSelectOptionType } from '@db-ux/react-core-components/dist/components/custom-select/model';
import { GlobalComponentProps } from 'src/types/components';

export type ComboBoxProps = GlobalComponentProps & {
	label?: string;
	placeholder?: string;
	options: Array<CustomSelectOptionType>;
	/**
	 * Initial selected value. Also doubles as a controlled value if kept in
	 * sync with "onChange" - same hybrid behavior as DBCustomSelect's "values"
	 * prop: the selection is owned internally and updates immediately on user
	 * interaction, independent of whether this prop is updated in response.
	 */
	value?: string;
	/** Fired on every keystroke, even free text that doesn't match any option. */
	onInputChange?: (text: string) => void;
	/** Fired only when the user picks an option from the list. */
	onChange?: (value: string, option: CustomSelectOptionType) => void;
	noResultsText?: string;
	/** Show the "no results" message when there are no filtered options (default: true). */
	showNoResults?: boolean;
};
