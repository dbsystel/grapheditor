import './ComboBox.scss';
import {
	DBCustomSelectDropdown,
	DBCustomSelectList,
	DBCustomSelectListItem,
	DBInfotext,
	DBInput
} from '@db-ux/react-core-components';
import { CustomSelectOptionType } from '@db-ux/react-core-components/dist/components/custom-select/model';
import clsx from 'clsx';
import { ChangeEvent, FocusEvent, useEffect, useId, useRef, useState } from 'react';
import { ComboBoxProps } from './ComboBox.interfaces';

const getLabelForValue = (options: Array<CustomSelectOptionType>, value?: string) =>
	options.find((option) => option.value === value)?.label ?? '';

/**
 * A combobox: an always-visible, always-editable text input that filters
 * a dropdown list of options as you type. Unlike DBCustomSelect, the input
 * itself is the trigger and stays visible/editable whether the list is
 * open or closed.
 *
 * Follows the same "hybrid controlled" pattern DBCustomSelect uses for its
 * "values" prop: "value" serves both as the initial value (uncontrolled usage)
 * and as a controlled value (if the parent keeps it in sync via "onChange").
 * The actual selection is owned internally ("internalValue") and is updated
 * immediately on user interaction - independent of whether the parent updates
 * "value" in response - exactly like DBCustomSelect's "_values" internal state.
 */
export const ComboBox = ({
	label,
	placeholder,
	options,
	value,
	onInputChange,
	onChange,
	noResultsText = 'No results',
	showNoResults,
	className,
	id,
	testId
}: ComboBoxProps) => {
	const radioGroupName = useId();
	const containerRef = useRef<HTMLDivElement | null>(null);
	// internal source of truth for the current selection, mirrors DBCustomSelect's "_values"
	const [internalValue, setInternalValue] = useState(value);
	const [inputText, setInputText] = useState(getLabelForValue(options, value));
	const [isOpen, setIsOpen] = useState(false);
	const rootElementClassName = clsx('combo-box', className);
	const filteredOptions = inputText
		? options.filter((option) =>
				(option.label || option.value || '').toLowerCase().includes(inputText.toLowerCase())
			)
		: options;
	// only show the "no results" message when there truly are none, unless explicitly suppressed
	const hasNoResults = filteredOptions.length === 0 && showNoResults !== false;

	// Re-sync internal state whenever the parent changes "value" externally.
	// Mirrors DBCustomSelect's useEffect(() => { ... }, [props.values]) sync,
	// including the "only update if actually different" guard so a user's own
	// in-progress selection isn't clobbered by an unrelated re-render.
	useEffect(() => {
		if (value !== internalValue) {
			setInternalValue(value);
			setInputText(getLabelForValue(options, value));
		}
	}, [value, options]);

	const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		const text = event.target.value;
		setInputText(text);
		// keep internalValue aligned with what the user typed, so the sync effect
		// above doesn't mistake the parent echoing this same text back via "value"
		// for an external change and overwrite inputText via getLabelForValue
		setInternalValue(text);
		setIsOpen(true);
		onInputChange?.(text);
	};

	const handleInputFocus = () => {
		setIsOpen(true);
	};

	const handleSelect = (option: CustomSelectOptionType) => {
		// update internal state immediately - do not wait for the parent to
		// feed "value" back in, same as DBCustomSelect's handleOptionSelected
		setInternalValue(option.value);
		setInputText(option.label || '');
		setIsOpen(false);
		onChange?.(option.value || '', option);
	};

	// Close the dropdown once focus leaves the whole combobox (input + list).
	const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
		const next = event.relatedTarget as Node | null;
		if (!containerRef.current?.contains(next)) {
			setIsOpen(false);
		}
	};

	return (
		<div
			id={id}
			className={rootElementClassName}
			ref={containerRef}
			onBlur={handleBlur}
			data-testid={testId}
		>
			<DBInput
				label={label}
				placeholder={placeholder}
				value={inputText}
				onChange={handleInputChange}
				onFocus={handleInputFocus}
				autoComplete="off"
				validation="no-validation"
			/>
			{isOpen && (
				<DBCustomSelectDropdown width="full" className="combo-box-dropdown">
					{hasNoResults ? (
						<DBInfotext semantic="warning">{noResultsText}</DBInfotext>
					) : (
						<DBCustomSelectList label={label}>
							{filteredOptions.map((option) => (
								<DBCustomSelectListItem
									key={option.value}
									type="radio"
									name={radioGroupName}
									value={option.value}
									checked={option.value === internalValue}
									onChange={() => handleSelect(option)}
								>
									{option.label}
								</DBCustomSelectListItem>
							))}
						</DBCustomSelectList>
					)}
				</DBCustomSelectDropdown>
			)}
		</div>
	);
};
