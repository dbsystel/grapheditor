import 'src/components/item-finder/ItemFinder.scss';
import { DBBadge, DBInfotext, DBInput } from '@db-ux/react-core-components';
import { ChangeEvent } from '@db-ux/react-core-components/dist/shared/model';
import clsx from 'clsx';
import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { ItemOverviewTooltip } from 'src/components/item-overview-tooltip/ItemOverviewTooltip';
import { Node } from 'src/models/node';
import { isObject, isString } from 'src/utils/helpers/general';
import { useDebounce } from 'src/utils/hooks/useDebounce';
import { useOutsideClick } from 'src/utils/hooks/useOutsideClick';
import { ItemFinderProps } from './ItemFinder.interfaces';

/**
 * This component renders a list of items (nodes for now, more TBD).
 *
 * Note: we separated message from the input component due to the result list having an absolute position
 * (top: 100% will push the list down once the message is rendered).
 * Note: this component was done without any design. Additional UI/functional changes are to be expected.
 *
 * TODO check if T option could be string. If not, refactor code.
 * TODO refactor the whole component once all requirements are known.
 */

export const ItemFinder = <T extends Node>({
	defaultInputValue,
	onInput,
	inputValue,
	onChange,
	onEnterKey,
	isMultiselect,
	isDisabled,
	options,
	defaultSelectedOptions,
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
	hideBadges = false
}: ItemFinderProps<T>) => {
	const [internalInputValue, setInternalInputValue] = useState<string>(defaultInputValue || '');
	const [showList, setShowList] = useState(false);
	// check internalSelectedOptions for up-to-date list of selected options
	const [selectedOptions, setSelectedOptions] = useState<Array<T>>(
		intersectOptions(defaultSelectedOptions || [], options)
	);
	const [selectedItemTooltipId, setSelectedItemTooltipId] = useState<string | null>(null);
	const tooltipRef = useRef<HTMLElement | null>(null);
	const delayedCallback = useDebounce(searchTimeoutMilliseconds);
	const inputFocusEventTriggered = useRef(false);
	const ref = useOutsideClick<HTMLDivElement>({
		callback: () => {
			if (showList) {
				setShowList(false);
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

	// observe user input value change
	useEffect(() => {
		// if user provided non-undefined value, use that value, otherwise fallback to internal value
		setInternalInputValue(inputValue === undefined ? internalInputValue : inputValue);
	}, [inputValue]);

	useEffect(() => {
		if (value == null) {
			setInternalInputValue('');
		}
	}, [value]);

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
		});
	};

	/**
	 * 	Allow default selected options to be selected only if they exist as options.
	 * 	This fixes bug where "defaultSelectedOptions" had different options than
	 * 	"options" prop, and they would still be selected internally, which would
	 * 	return wrong selected options in the "onChange" handler.
	 */
	function intersectOptions(source: Array<T>, target: Array<T>) {
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
	const isOptionSelected = (option: T) => {
		return internalSelectedOptions.find((selectedOption) => selectedOption.id === option.id);
	};

	/**
	 * Function executed when an option is selected or deselected.
	 * Options can also be deselected via clicking on the associated chips.
	 */
	const onChangeHandler = (option: T) => {
		let freshSelectedOptions: Array<T> = [];
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
			setShowList(false);
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

	const inputFocusHandler = () => {
		inputFocusEventTriggered.current = true;
		setShowList(true);
	};

	const inputBlurHandler = () => {
		inputFocusEventTriggered.current = false;
	};

	const inputClickHandler = (event: MouseEvent<HTMLInputElement>) => {
		// toggle list only after 2nd click (important since the "click" event is
		// triggered after "focus" event) on the focused input
		if (document.activeElement === event.target && !inputFocusEventTriggered.current) {
			setShowList(!showList);
		}

		inputFocusEventTriggered.current = false;
	};

	const mouseEnterHandler = (event: MouseEvent<HTMLSpanElement>, option: T) => {
		tooltipRef.current = event.currentTarget;
		setSelectedItemTooltipId(option.id);
	};

	const mouseLeaveHandler = () => {
		tooltipRef.current = null;
		setSelectedItemTooltipId(null);
	};

	const listClassName = clsx(
		'item-finder__list',
		'border-width-xs',
		'db-bg-color-basic-level-1',
		isMultiselect && 'item-finder__list--checkbox'
	);
	const inputVariant = variant || 'floating';
	const message = validMessage || invalidMessage;

	return (
		<div ref={ref} id={id} className={rootElementClassName} data-testid={testId}>
			<div className="item-finder__input-wrapper">
				<DBInput
					value={internalInputValue}
					label={label}
					placeholder={placeholder}
					onChange={inputChangeHandler}
					onKeyUp={enterKeyHandler}
					onClick={inputClickHandler}
					onFocus={inputFocusHandler}
					onBlur={inputBlurHandler}
					variant={inputVariant}
					invalidMessage=""
					validMessage=""
					disabled={isDisabled}
					role="combobox"
				/>
				{showList && options.length > 0 && (
					<ul className={listClassName}>
						{options.map((option, index) => {
							const isOptionString = isString(option);
							const isNode = !isOptionString;
							const isSelected = isOptionSelected(option);
							const renderTooltip =
								selectedItemTooltipId &&
								isNode &&
								selectedItemTooltipId === option.id;
							const listItemClassName = clsx(
								'item-finder__list-item',
								isMultiselect && 'item-finder__list-item--checkbox',
								isSelected && 'item-finder__list-item--checked'
							);

							return (
								<li key={index} className={listItemClassName}>
									<div
										className="item-finder__list-item-content"
										onClick={() => onChangeHandler(option)}
									>
										{isOptionString ? (
											<span>{option}</span>
										) : (
											<span
												onMouseEnter={(event) =>
													mouseEnterHandler(event, option)
												}
												onMouseLeave={mouseLeaveHandler}
											>
												<span className="item-finder__list-item-title">
													<strong>{option.title}</strong>{' '}
													<i>(ID: {option.id})</i>
												</span>
												<span>{option.description}</span>

												{renderTooltip && (
													<ItemOverviewTooltip
														item={option}
														tooltipRef={tooltipRef.current}
													/>
												)}
											</span>
										)}
									</div>
								</li>
							);
						})}
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
								{isString(badge) ? badge : badge.title}
								<span data-icon="bin" />
							</DBBadge>
						);
					})}
				</div>
			)}
		</div>
	);
};
