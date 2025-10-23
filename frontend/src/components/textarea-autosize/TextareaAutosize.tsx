import './TextareaAutosize.scss';
import { DBTextarea } from '@db-ux/react-core-components';
import { InteractionEvent } from '@db-ux/react-core-components/dist/shared/model';
import clsx from 'clsx';
import { ChangeEvent, forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from 'src/utils/hooks/useDebounce';
import { TextareaAutosizeProps } from './TextareaAutosize.interfaces';

/**
 * Overly-simplified version of https://github.com/mui/material-ui/blob/next/packages/mui-base/src/TextareaAutosize/TextareaAutosize.tsx.
 *
 * NOTE: This component is a REPLACEMENT for the DBTextarea component until this
 * https://github.com/db-ux-design-system/core-web/issues/2508 has been resolved and/or the DBTextarea
 * component supports autosize functionality.
 *
 * NOTE: Set the textarea value directly via a reference, instead of updating a state.
 * This works as a temporary workaround for the https://github.com/db-ux-design-system/core-web/issues/2508 issue.
 */
export const TextareaAutosize = forwardRef<HTMLTextAreaElement | null, TextareaAutosizeProps>(
	({ onBlur, onFocus, id, className, testId, onChange, value, ...rest }, ref) => {
		const localRef = useRef<HTMLTextAreaElement | null>(null);
		const [isFocused, setIsFocused] = useState(false);
		const [lineNumbers, setLineNumbers] = useState<Array<number>>([1]);
		const rootElementClassName = clsx('textarea-autosize db-bg-color-lvl-3', className, {
			'textarea-autosize--focused': isFocused
		});
		const rootElementRef = useRef<HTMLDivElement>(null);
		const rootElementDefaultHeight = useRef(0);
		const testElementRef = useRef<HTMLDivElement>(null);
		const rootElementSize = useRef({ width: -1 });
		const observerRef = useRef(
			new ResizeObserver(function (mutations) {
				const observerSize = mutations.at(0)?.contentBoxSize.at(0);

				if (observerSize) {
					// initial render
					if (rootElementSize.current.width === -1) {
						rootElementSize.current.width = observerSize.inlineSize;
					}
					// if width has changed
					else if (rootElementSize.current.width !== observerSize.inlineSize) {
						rootElementSize.current.width = observerSize.inlineSize;
						delayedCallback(localRefreshHeight);
					}
				}
			})
		);
		const delayedCallback = useDebounce(200);

		useEffect(() => {
			localRefreshHeight();
		}, [value]);

		const onRootElementRefChange = useCallback((element: HTMLDivElement | null) => {
			if (element) {
				rootElementRef.current = element;
				rootElementDefaultHeight.current = element.offsetHeight;
				observerRef.current.observe(element);
			} else {
				observerRef.current.disconnect();
			}
		}, []);
		/**
		 * 	useCallback to prevent double calling of ref callback with null and the element
		 * 	@see https://legacy.reactjs.org/docs/refs-and-the-dom.html#caveats-with-callback-refs
		 */
		const onRefChange = useCallback((element: HTMLTextAreaElement | null) => {
			localRef.current = element;

			if (typeof ref === 'function') {
				ref(element);
			} else if (ref) {
				ref.current = element;
			}
		}, []);

		const localRefreshHeight = useCallback(() => {
			const localRefNode = localRef.current;
			const testElement = testElementRef.current;

			if (localRefNode && testElement) {
				const lines = localRefNode.value.split('\n');
				const newLineNumbers: Array<number> = [];
				let rowCounter = 1;

				lines.forEach((line) => {
					testElement.innerText = line;

					// the number 20 comes from CSS of this file
					const numberOfRows = testElement.scrollHeight / 20;

					// if fresh new line (without any characters)
					if (numberOfRows === 0) {
						newLineNumbers.push(rowCounter);
						rowCounter += 1;
					}

					for (let i = 0, l = numberOfRows; i < l; i++) {
						if (i === 0) {
							newLineNumbers.push(rowCounter);
							rowCounter += 1;
						} else {
							newLineNumbers.push(-1);
						}
					}
				});

				testElement.innerText = '';

				setLineNumbers(newLineNumbers);
			}
		}, []);

		const localOnChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
			if (onChange) {
				onChange(event);
			}

			localRefreshHeight();
		};

		const localOnBlur = (event: InteractionEvent<HTMLTextAreaElement>) => {
			setIsFocused(false);

			if (onBlur) {
				onBlur(event);
			}
		};

		const localOnFocus = (event: InteractionEvent<HTMLTextAreaElement>) => {
			setIsFocused(true);

			if (onFocus) {
				onFocus(event);
			}
		};

		return (
			<div
				id={id}
				className={rootElementClassName}
				data-testid={testId}
				ref={onRootElementRefChange}
			>
				<div className="textarea-autosize__content">
					<div className="textarea-autosize__row-numbers db-bg-color-basic-level-4">
						{lineNumbers.map((lineNumber, index) => {
							const renderValue = lineNumber > 0 ? lineNumber : '\u00A0';
							const key = lineNumber + '' + index;

							return <div key={key}>{renderValue}</div>;
						})}
					</div>
					<div className="textarea-autosize__wrapper">
						<DBTextarea
							ref={onRefChange}
							//rows={lineNumbers.length}
							{...rest}
							onChange={localOnChange}
							onBlur={localOnBlur}
							onFocus={localOnFocus}
							value={value}
							rows=""
						/>
						<div ref={testElementRef} className="textarea-autosize__test-element"></div>
					</div>
				</div>
			</div>
		);
	}
);

TextareaAutosize.displayName = 'TextareaAutosize';
