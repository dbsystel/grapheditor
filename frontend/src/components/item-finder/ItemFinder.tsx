import 'src/components/item-finder/ItemFinder.scss';
import { DBBadge, DBButton, DBInfotext, DBInput, DBTooltip } from '@db-ux/react-core-components';
import { ChangeEvent } from '@db-ux/react-core-components/dist/shared/model';
import clsx from 'clsx';
import { FocusEvent, KeyboardEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Node } from 'src/models/node';
import { useItemOverviewPopoverStore } from 'src/stores/item-overview-popover';
import { isArray, isObject, isString } from 'src/utils/helpers/general';
import { areNodesSameById } from 'src/utils/helpers/nodes';
import { useDebounce } from 'src/utils/hooks/useDebounce';
import { useOutsideClick } from 'src/utils/hooks/useOutsideClick';
import { idFormatter } from 'src/utils/id-formatter';
import { ItemFinderProps } from './ItemFinder.interfaces';

/**
 * This component renders a list of items (nodes for now, more TBD).
 *
 * Note: we separated message from the input component due to the result list having an absolute position
 * (top: 100% will push the list down once the message is rendered).
 * Note: this component was done without any design. Additional UI/functional changes are to be expected.
 *
 * TODO refactor the whole component once all requirements are known.
 */

export const ItemFinder = ({
	defaultInputValue,
	onInput,
	onInputFocus,
	onInputBlur,
	inputValue,
	onChange,
	onEnterKey,
	isMultiselect,
	isDisabled,
	options,
	optionDelimiterAfterIndexes,
	defaultValue,
	searchTimeoutMilliseconds = 300,
	label,
	variant,
	semantic,
	validMessage,
	invalidMessage,
	value,
	id,
	className,
	testId,
	placeholder,
	hideBadges = false,
	noInputMatchTooltip,
	shouldShowNoInputMatchTooltip = true,
	hasMoreOptions,
	allowReset,
	resetTooltipText,
	onReset
}: ItemFinderProps) => {
	const { t } = useTranslation();
	// TODO fix to respect following rules:
	// - if user provided inputValue, show that as input text (this is currently bypassed when user
	//	 starts typing somethig into the input field)
	// - otherwise switch to internal input value
	const [internalInputValue, setInternalInputValue] = useState<string>(defaultInputValue || '');
	const [showList, setShowList] = useState(false);
	// check internalSelectedOptions for up-to-date list of selected options
	const [selectedOptions, setSelectedOptions] = useState<Array<Node>>(
		intersectOptions(
			defaultValue ? (isArray(defaultValue) ? defaultValue : [defaultValue]) : [],
			options
		)
	);
	const delayedCallback = useDebounce(searchTimeoutMilliseconds);
	const ref = useOutsideClick<HTMLDivElement>({
		callback: () => {
			const currentlyHoveredOverview = useItemOverviewPopoverStore
				.getState()
				.getCurrentlyHoveredOverview();

			if (currentlyHoveredOverview) {
				return;
			}

			if (showList) {
				shouldShowList(false);
			}

			// set selected option title as input value if user cleared the input and clicked outside
			if (!internalInputValue.trim() && internalSelectedOptions.length && !isMultiselect) {
				setInternalInputValue(internalSelectedOptions[0].title);
			}
		}
	});
	const internalValue = value || value === null ? value : selectedOptions;
	const internalSelectedOptions = Array.isArray(internalValue)
		? internalValue
		: internalValue === null
			? []
			: [internalValue];
	const rootElementClassName = clsx('item-finder', className);

	// TODO check if https://github.com/db-ux-design-system/core-web/issues/7141 is resolved
	const onRefChange = useCallback((element: HTMLInputElement | null) => {
		if (element) {
			element.setAttribute('autocomplete', 'off');
		}
	}, []);

	// observe user input value change
	useEffect(() => {
		// if user provided non-undefined value, use that value, otherwise fallback to internal value
		setInternalInputValue(inputValue === undefined ? internalInputValue : inputValue);
	}, [inputValue]);

	useEffect(() => {
		if (value === null) {
			setInternalInputValue('');
		}
	}, [value]);

	const shouldShowList = (showList: boolean) => {
		if (!showList) {
			useItemOverviewPopoverStore.getState().reset();
		}
		setShowList(showList);
	};

	/**
	 * Function executed on the input field change.
	 * The "onSearch" prop will be triggered after user finished typing if the
	 * "searchTimeoutMilliseconds" is greater than 0 milliseconds.
	 */
	const inputChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
		setInternalInputValue(event.target.value);

		delayedCallback(() => {
			if (onInput) {
				onInput(event.target.value);
			}
			setShowList(true);
		});
	};

	/**
	 * 	Allow default selected options to be selected only if they exist as options.
	 * 	This fixes bug where "defaultValue" had different options than
	 * 	"options" prop, and they would still be selected internally, which would
	 * 	return wrong selected options in the "onChange" handler.
	 */
	function intersectOptions(source: Array<Node>, target: Array<Node>) {
		return source.filter((sourceElement) => {
			if (isObject(sourceElement) && isObject(target[0])) {
				return target.some((targetElement) => targetElement.id === sourceElement.id);
			}

			return target.includes(sourceElement);
		});
	}

	/**
	 * Simple function the check if an option is selected.
	 */
	const isOptionSelected = (option: Node) => {
		return internalSelectedOptions.find((selectedOption) =>
			areNodesSameById(selectedOption, option)
		);
	};

	const hasOptionDelimiter = (index: number) => {
		return optionDelimiterAfterIndexes
			? optionDelimiterAfterIndexes.includes(index) && index !== options.length - 1
			: false;
	};

	/**
	 * Function executed when an option is selected or deselected.
	 * Options can also be deselected via clicking on the associated chips.
	 */
	const onChangeHandler = (option: Node) => {
		let freshSelectedOptions: Array<Node> = [];
		let isSelected = false;

		if (isMultiselect) {
			if (isOptionSelected(option)) {
				freshSelectedOptions = internalSelectedOptions.filter((selectedOption) => {
					if (isObject(option) && isObject(selectedOption)) {
						return option.id !== selectedOption.id;
					}
					return selectedOption !== option;
				});
			} else {
				isSelected = true;
				freshSelectedOptions = [...internalSelectedOptions, option];
			}
		} else {
			isSelected = true;
			freshSelectedOptions = [option];

			// hide the list on each option click
			shouldShowList(false);
			// update input value
			setInternalInputValue(isString(option) ? option : option.title);
		}

		setSelectedOptions(freshSelectedOptions);
		if (onChange) {
			onChange(option, isSelected, freshSelectedOptions);
		}
	};

	const enterKeyHandler = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter' && onEnterKey) {
			onEnterKey(internalInputValue);
		}
	};

	const inputFocusHandler = (event: FocusEvent<HTMLInputElement>) => {
		shouldShowList(true);

		if (onInputFocus) {
			onInputFocus(event);
		}
	};

	const inputBlurHandler = (event: FocusEvent<HTMLInputElement>) => {
		if (onInputBlur) {
			onInputBlur(event);
		}
	};

	/**
	 * Clears the current selection and the input value.
	 *
	 * In uncontrolled mode this fully resets the component via its internal state.
	 * In controlled mode the parent still owns "value", so it has to react to "onReset"
	 * and null out the controlled "value" for the reset to fully take effect.
	 */
	const handleReset = () => {
		setInternalInputValue('');
		setSelectedOptions([]);

		if (onReset) {
			onReset();
		}
	};

	const listClassName = clsx(
		'item-finder__list',
		'border-width-xs',
		'db-bg-color-basic-level-1',
		isMultiselect && 'item-finder__list--checkbox'
	);
	const inputVariant = variant || 'floating';
	const message = validMessage || invalidMessage;
	const showConfirmInputTooltip =
		noInputMatchTooltip && options.length === 0 && !!internalInputValue;
	const listItemDefaultClassName = 'item-finder__list-item';
	// strictly selection-gated: only offer the clear button once something is selected
	const showResetButton = allowReset && internalSelectedOptions.length > 0;

	return (
		<div ref={ref} id={id} className={rootElementClassName} data-testid={testId}>
			<div className="item-finder__input-wrapper">
				<DBInput
					className="item-finder__input"
					value={internalInputValue}
					label={label}
					placeholder={placeholder}
					onChange={inputChangeHandler}
					onKeyUp={enterKeyHandler}
					onFocus={inputFocusHandler}
					onBlur={inputBlurHandler}
					variant={inputVariant}
					invalidMessage=""
					validMessage=""
					disabled={isDisabled}
					role="combobox"
					data-show-confirmation-tooltip={showConfirmInputTooltip}
					ref={onRefChange}
				>
					{shouldShowNoInputMatchTooltip && (
						<DBTooltip
							animation={false}
							className="item-finder__input-confirmation-tooltip db-tooltip-fix db-tooltip-fix--top"
						>
							{noInputMatchTooltip}
						</DBTooltip>
					)}
				</DBInput>
				{showResetButton && (
					<DBButton
						type="button"
						icon="cross"
						variant="ghost"
						size="medium"
						noText
						className="item-finder__reset-button"
						onClick={handleReset}
					>
						<DBTooltip showArrow={false}>
							{resetTooltipText ?? t('item_finder_reset_button_tooltip')}
						</DBTooltip>
					</DBButton>
				)}
				{showList && options.length > 0 && (
					<ul className={listClassName}>
						{options.map((option, index) => {
							const isOptionString = isString(option);
							const isSelected = isOptionSelected(option);
							const hasDelimiter = hasOptionDelimiter(index);

							const listItemClassName = clsx(
								listItemDefaultClassName,
								isMultiselect && 'item-finder__list-item--checkbox',
								isSelected && 'item-finder__list-item--checked',
								hasDelimiter && 'item-finder__list-item--delimiter'
							);

							return (
								<li key={index} className={listItemClassName}>
									<div
										className="item-finder__list-item-content"
										onClick={() => onChangeHandler(option)}
									>
										{isOptionString ? (
											<span>{idFormatter.parseIdToName(option)}</span>
										) : (
											<span
												ref={(element) => {
													if (element) {
														useItemOverviewPopoverStore
															.getState()
															.registerTriggerElement({
																triggerElement: element,
																item: option
															});
													}
												}}
											>
												<span className="item-finder__list-item-title">
													<strong>
														{idFormatter.parseIdToName(option.title)}
													</strong>
												</span>
												<span className="item-finder__list-item-description">
													{option.description}
												</span>
											</span>
										)}
									</div>
								</li>
							);
						})}

						{hasMoreOptions && (
							<li
								className={
									listItemDefaultClassName + ' item-finder__list-item--disabled'
								}
							>
								<div className="item-finder__list-item-content">
									...
									<DBTooltip>
										{t('item_finder_has_more_options_tooltip')}
									</DBTooltip>
								</div>
							</li>
						)}
					</ul>
				)}
			</div>

			{message && (
				// show messages separately from the DBInput component in order
				// to keep the ItemFinder list directly next to the input (the list
				// is absolutely positioned, and rendering a message inside the DBInput
				// component will make its height bigger, which will "push" the list down)
				<DBInfotext className="item-finder__info-text" semantic={semantic} size="small">
					{message}
				</DBInfotext>
			)}

			{!hideBadges && isMultiselect && internalSelectedOptions.length > 0 && (
				<div className="item-finder__badges">
					{internalSelectedOptions.map((badge, index) => {
						return (
							<DBBadge
								key={index.toString()}
								semantic="successful"
								onClick={() => onChangeHandler(badge)}
							>
								{idFormatter.parseIdToName(isString(badge) ? badge : badge.title)}
								<span data-icon="bin" />
							</DBBadge>
						);
					})}
				</div>
			)}
		</div>
	);
};
