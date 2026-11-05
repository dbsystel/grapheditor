import './ParaQueryEditor.scss';
import { DBInput } from '@db-ux/react-core-components';
import { CustomSelectOptionType } from '@db-ux/react-core-components/dist/components/custom-select/model';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { ComboBox } from 'src/components/combo-box/ComboBox';
import { ParaQuery, ParaQueryParameterType, ParaQueryParameterValues } from 'src/models/paraquery';
import { api } from 'src/utils/api/api';
import { clone, objectHasOwnProperty } from 'src/utils/helpers/general';
import { useDebounce } from 'src/utils/hooks/useDebounce';
import { ParaQueryEditorProps } from './ParaQueryEditor.interfaces';

const allowedTypes = ['string', 'integer'];

/**
 * Component responsible for rendering a para-query with parameters.
 */
export const ParaQueryEditor = ({
	paraQuery,
	onParameterChange,
	handleRef,
	id,
	className,
	testId
}: ParaQueryEditorProps) => {
	const rootElementRef = useRef<HTMLDivElement | null>(null);
	const parameterValuesRef = useRef<ParaQueryParameterValues>({});
	const [options, setOptions] = useState<Record<string, Array<CustomSelectOptionType>>>({});
	const [tokens, setTokens] = useState<Array<string>>([]);
	const delayedCallback = useDebounce(500);
	const rootElementClassName = clsx('para-query-editor', className);

	if (handleRef) {
		handleRef.current.getParameterValues = () => {
			return clone(parameterValuesRef.current);
		};
	}

	useEffect(() => {
		initializeOptions();
		initializeParameterValues();
		initializeTokens();
	}, [paraQuery]);

	const initializeOptions = (paraQueryParameter?: ParaQuery) => {
		const localParaQuery = paraQueryParameter || paraQuery;
		const localOptions: Record<string, Array<CustomSelectOptionType>> = {};

		Object.keys(localParaQuery.parameters).forEach((parameterKey) => {
			// the "objectHasOwnProperty" check is (probably) not needed, since object keys are already resolved,
			// but leave it so it becomes a habit of checking object keys existance
			if (objectHasOwnProperty(localParaQuery.parameters, parameterKey)) {
				const suggestions = localParaQuery.parameters[parameterKey].suggestions;

				if (suggestions) {
					localOptions[parameterKey] = [];

					suggestions.forEach((suggestion) => {
						localOptions[parameterKey].push({
							label: suggestion.toString(),
							value: suggestion.toString()
						});
					});
				}
			}
		});

		setOptions(localOptions);
	};

	const initializeParameterValues = () => {
		parameterValuesRef.current = {};

		Object.keys(paraQuery.parameters).forEach((parameterKey) => {
			// the "objectHasOwnProperty" check is (probably) not needed, since object keys are already resolved,
			// but leave it so it becomes a habit of checking object keys existance
			if (objectHasOwnProperty(paraQuery.parameters, parameterKey)) {
				const defaultValue = paraQuery.parameters[parameterKey].default_value;

				parameterValuesRef.current[parameterKey] =
					defaultValue !== undefined ? defaultValue : null;
			}
		});
	};

	const initializeTokens = () => {
		// split while keeping delimiters: $variables, plain words, spaces, and punctuation
		const tokens = paraQuery.user_text.match(/\$[a-zA-Z_]\w*|\w+|\s+|[^\w\s]/g);
		setTokens(tokens || []);
	};

	const renderParameter = (parameterKey: string) => {
		const parameter = objectHasOwnProperty(paraQuery.parameters, parameterKey || '')
			? paraQuery.parameters[parameterKey || '']
			: null;

		if (!parameter || !allowedTypes.includes(parameter.type.toLowerCase())) {
			return '';
		}

		const type = parameter.type;
		const isTypeInteger = type === 'integer';
		const value = parameterValuesRef.current[parameterKey]
			? parameterValuesRef.current[parameterKey].toString()
			: undefined;
		const inputType = isTypeInteger ? 'number' : 'string';

		// if parameter "suggestions" property defined, treat it as a dropdown, otherwise as regular input
		if (parameter.suggestions) {
			const comboBoxOptions = objectHasOwnProperty(options, parameterKey)
				? options[parameterKey]
				: [];

			return (
				<ComboBox
					key={parameterKey}
					value={value}
					label={parameter.help_text}
					options={comboBoxOptions}
					onChange={(optionValue) => {
						localOnChange(parameterKey, optionValue, type);
					}}
					onInputChange={(inputText) => {
						localOnChange(parameterKey, inputText, type);
					}}
					showNoResults={true}
				/>
			);
		} else {
			return (
				<DBInput
					key={parameterKey}
					label={parameter.help_text}
					defaultValue={value}
					onChange={(event) => {
						localOnChange(parameterKey, event.target.value, type);
					}}
					dataList={parameter.suggestions}
					validation="no-validation"
					type={inputType}
				/>
			);
		}
	};

	const localOnChange = (key: string, value: string, type: ParaQueryParameterType) => {
		const valueToStore = type === 'integer' ? parseInt(value) : value;

		parameterValuesRef.current[key] = valueToStore;

		if (onParameterChange) {
			onParameterChange(key, valueToStore, type);
		}

		delayedCallback(() => {
			api.paraQueries.fetch
				.postParaQuery({
					paraQueryId: paraQuery.db_id,
					parameters: parameterValuesRef.current
				})
				.then((response) => {
					initializeOptions(response.data.paraquery);
				});
		});
	};

	const isTokenVariable = (token: string) => {
		return token.startsWith('$') && token.length > 1;
	};

	return (
		<div id={id} className={rootElementClassName} ref={rootElementRef} data-testid={testId}>
			{tokens.map((token, index) => {
				if (isTokenVariable(token)) {
					return renderParameter(token.substring(1));
				} else {
					return <span key={token + index}>{token}</span>;
				}
			})}
		</div>
	);
};
