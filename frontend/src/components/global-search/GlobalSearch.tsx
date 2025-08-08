import './GlobalSearch.scss';
import clsx from 'clsx';
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TextareaAutosize } from 'src/components/textarea-autosize/TextareaAutosize';
import { useGraphStore } from 'src/stores/graph';
import { useSearchStore } from 'src/stores/search';
import {
	GLOBAL_SEARCH_PARAMETER_KEY,
	GLOBAL_SEARCH_TYPE_KEY,
	GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT
} from 'src/utils/constants';
import { GlobalSearchProps } from './GlobalSearch.interfaces';

/**
 * Simple component which enables global search functionality.
 * It expects Cypher Query string as input.
 */

export const GlobalSearch = ({ id, className, testId, ref }: GlobalSearchProps) => {
	const [searchParams, setSearchParameters] = useSearchParams();
	const type = useSearchStore((store) => store.type);
	const setQuery = useSearchStore((store) => store.setQuery);
	const searchValue = useSearchStore((store) => store.searchValue);
	const executeSearch = useSearchStore((store) => store.executeSearch);
	const clearPerspective = useGraphStore((store) => store.clearPerspective);
	const rootElementClassName = clsx('global-search', className);
	const [searchState, setSearchState] = useState({
		[GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY]: {
			value: '',
			isDirty: false
		},
		[GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT]: {
			value: '',
			isDirty: false
		}
	});

	useEffect(() => {
		if (isTypeValid(type)) {
			setSearchState((prevState) => {
				const state = window.structuredClone(prevState);
				const selectedState = state[type];

				if (selectedState && !selectedState.isDirty) {
					selectedState.value = searchValue;
				}

				return state;
			});
		}
	}, [searchValue]);

	const triggerSearch = () => {
		const searchQuery = getTextareaValue();

		// update search store
		setQuery(searchQuery);
		clearPerspective();
		executeSearch();

		setSearchParameters({
			...Object.fromEntries(searchParams),
			[GLOBAL_SEARCH_TYPE_KEY]: type,
			[GLOBAL_SEARCH_PARAMETER_KEY]: searchQuery
		});
	};

	ref.current = { triggerSearch: triggerSearch };

	const isTypeValid = (
		type: string
	): type is
		| typeof GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY
		| typeof GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT => {
		return (
			type === GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY ||
			type === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT
		);
	};

	const getTextareaValue = () => {
		if (isTypeValid(type)) {
			return searchState[type].value;
		}

		return '';
	};

	const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		if (isTypeValid(type)) {
			setSearchState((prevState) => {
				const state = window.structuredClone(prevState);

				state[type] = {
					value: event.target.value,
					isDirty: true
				};

				return state;
			});
		}
	};

	const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		// if not new line
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			triggerSearch();
		}
	};

	let value = '';
	if (isTypeValid(type)) {
		value = searchState[type].value;
	}

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<div className="global-search__content">
				<TextareaAutosize
					key={type}
					onKeyDown={onKeyDown}
					onChange={onChange}
					value={value}
					autoComplete="off"
					autoCorrect="off"
					autoCapitalize="off"
					spellCheck={false}
					data-density="functional"
					className="global-search__input"
					label=""
					resize="none"
				/>
			</div>
		</div>
	);
};
