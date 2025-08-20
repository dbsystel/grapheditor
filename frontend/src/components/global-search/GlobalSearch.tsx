import './GlobalSearch.scss';
import { DBButton, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { TextareaAutosize } from 'src/components/textarea-autosize/TextareaAutosize';
import { useGraphStore } from 'src/stores/graph';
import { SearchStoreSearchType, useSearchStore } from 'src/stores/search';
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
	// we could also be a hook, since renderings will be consistent
	const type = useSearchStore.getState().type;

	// exit early if "type" is not a search type
	if (!useSearchStore.getState().isSearchType(type)) {
		return;
	}

	const { t } = useTranslation();
	const [searchParams, setSearchParameters] = useSearchParams();
	const setQuery = useSearchStore((store) => store.setQuery);
	const searchValue = useSearchStore((store) => store.searchValue);
	const executeSearch = useSearchStore((store) => store.executeSearch);
	const addHistoryEntry = useSearchStore((store) => store.addHistoryEntry);
	const exportSelectedHistory = useSearchStore((store) => store.exportSelectedHistory);
	const clearSelectedHistory = useSearchStore((store) => store.clearSelectedHistory);
	const clearPerspective = useGraphStore((store) => store.clearPerspective);
	const rootElementClassName = clsx('global-search', className);
	const [searchState, setSearchState] = useState<
		Record<
			SearchStoreSearchType,
			{ value: string; temporaryValue: string; isDirty: boolean; historyIndex: number }
		>
	>({
		[GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY]: {
			value: '',
			temporaryValue: '',
			isDirty: false,
			historyIndex: -1
		},
		[GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT]: {
			value: '',
			temporaryValue: '',
			isDirty: false,
			historyIndex: -1
		}
	});
	const getSelectedHistory = useSearchStore((store) => store.getSelectedHistory);
	const selectedHistory = getSelectedHistory();

	useEffect(() => {
		setSearchState((prevState) => {
			const state = window.structuredClone(prevState);
			const selectedState = state[type];

			if (selectedState && !selectedState.isDirty) {
				selectedState.value = searchValue;
				selectedState.temporaryValue = searchValue;
			}

			return state;
		});
	}, [searchValue]);

	const triggerSearch = () => {
		const searchQuery = getValue();

		// update search store
		setQuery(searchQuery);
		clearPerspective();
		executeSearch();
		addHistoryEntry(type, searchQuery);

		setSearchParameters({
			...Object.fromEntries(searchParams),
			[GLOBAL_SEARCH_TYPE_KEY]: type,
			[GLOBAL_SEARCH_PARAMETER_KEY]: searchQuery
		});
	};

	ref.current = { triggerSearch: triggerSearch };

	const getValue = () => {
		return getSelectedSearchState().value;
	};

	const getSelectedSearchState = () => {
		return searchState[type];
	};

	const setTextareaValue = (value: string) => {
		setSearchState((prevState) => {
			const state = window.structuredClone(prevState);

			state[type].value = value;
			state[type].isDirty = true;

			if (state[type].historyIndex === -1) {
				state[type].temporaryValue = value;
			}

			return state;
		});
	};

	const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		setTextareaValue(event.target.value);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'ArrowUp' && event.ctrlKey) {
			goHistory('backward');
		} else if (event.key === 'ArrowDown' && event.ctrlKey) {
			goHistory('forward');
		}
		// if not new line
		else if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			triggerSearch();
		}
	};

	const goHistory = (direction: 'backward' | 'forward') => {
		if (!selectedHistory) {
			return;
		}

		const selectedSearchState = window.structuredClone(getSelectedSearchState());
		let historyIndex = selectedSearchState.historyIndex;

		if (direction === 'backward') {
			historyIndex += 1;
		} else if (direction === 'forward') {
			historyIndex -= 1;
		}

		// skip history entry if:
		// - history entry is the same as the current search value
		// - history index is 0 and the history entry is the same as the search temporary value
		const selectedHistoryEntry = selectedHistory[historyIndex];
		if (
			selectedHistoryEntry === searchState[type].value ||
			(historyIndex === 0 && selectedHistoryEntry === searchState[type].temporaryValue)
		) {
			historyIndex += direction === 'backward' ? 1 : -1;
		}

		//
		if (historyIndex < -1) {
			historyIndex = -1;
		} else if (historyIndex >= selectedHistory.length) {
			historyIndex = selectedHistory.length - 1;
		}

		if (historyIndex === selectedSearchState.historyIndex) {
			return;
		}

		const historyValue = selectedHistory.at(historyIndex);

		setSearchState((state) => {
			const newValue = historyIndex === -1 ? state[type].temporaryValue : historyValue;

			return {
				...state,
				[type]: {
					...state[type],
					historyIndex: historyIndex,
					value: newValue
				}
			};
		});
	};

	const localClearSelectedHistory = () => {
		clearSelectedHistory();

		setSearchState({
			...searchState,
			[type]: {
				...searchState[type],
				historyIndex: -1
			}
		});
	};

	const value = getValue();

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
				<DBButton
					type="button"
					icon="save"
					noText={true}
					size="small"
					onClick={exportSelectedHistory}
				>
					<DBTooltip showArrow={false} width="fixed" placement="bottom-end">
						{t('global_search_history_save_tooltip', { type: type })}
					</DBTooltip>
				</DBButton>
				<DBButton
					type="button"
					icon="bin"
					noText={true}
					size="small"
					onClick={localClearSelectedHistory}
				/>
			</div>
		</div>
	);
};
