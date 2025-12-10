import './ParaQueryEditor.scss';
import { DBInput } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { objectHasOwnProperty } from 'src/utils/helpers/general';
import { ParaQueryEditorProps } from './ParaQueryEditor.interfaces';

/**
 * Component responsible for rendering a para-query with parameters.
 */
export const ParaQueryEditor = ({
	paraQuery,
	onParameterChange,
	defaultParameterValues,
	id,
	className,
	testId
}: ParaQueryEditorProps) => {
	const [paraQueryParameterKeys, setParaQueryParameterKeys] = useState<Array<string>>([]);
	const rootElementRef = useRef<HTMLDivElement | null>(null);
	const rootElementClassName = clsx('para-query-editor', className);

	useEffect(() => {
		const rootElement = rootElementRef.current;

		if (rootElement) {
			// search for words starting with $ sign
			const parametersInsideText = paraQuery.user_text.match(/\$\w+/gim);

			if (parametersInsideText) {
				const cleanParameterKeys: Array<string> = [];

				/**
				 * Replace words with $ sign with a HTML container (used later by React Portal).
				 * This turned out to be a simple and effective method since we must preserve sentences
				 * as they are, and only replace parameters with React components.
				 */
				rootElement.innerHTML = paraQuery.user_text.replaceAll(/\$\w+/gim, (match) => {
					const cleanParameterKey = match.substring(1);
					cleanParameterKeys.push(cleanParameterKey);

					return `<div data-para-query-parameter="${cleanParameterKey}"></div>`;
				});

				setParaQueryParameterKeys(cleanParameterKeys);
			}
		}
	}, [paraQuery]);

	const renderParameter = (parameterKey: string) => {
		const parameter = objectHasOwnProperty(paraQuery.parameters, parameterKey || '')
			? paraQuery.parameters[parameterKey || '']
			: null;

		if (!parameter || parameter.type.toLowerCase() !== 'string') {
			return '';
		}

		const onChange = (event: ChangeEvent<HTMLInputElement>) => {
			onParameterChange(parameterKey, event.target.value);
		};

		const defaultValue = defaultParameterValues
			? defaultParameterValues[parameterKey]
			: parameter.default_value;

		return (
			<DBInput
				label={parameter.help_text}
				defaultValue={defaultValue}
				onChange={onChange}
				dataList={parameter.suggestions}
				validation="no-validation"
			/>
		);
	};

	return (
		<div id={id} className={rootElementClassName} ref={rootElementRef} data-testid={testId}>
			{paraQuery.user_text}
			{paraQueryParameterKeys.map((parameterKey) => {
				if (!rootElementRef.current) {
					return null;
				}

				const targetElement = rootElementRef.current.querySelector(
					`[data-para-query-parameter="${parameterKey}"]`
				);

				if (targetElement) {
					return createPortal(renderParameter(parameterKey), targetElement);
				} else {
					return null;
				}
			})}
		</div>
	);
};
