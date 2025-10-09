import './DatabaseMenuSelector.scss';
import { DBCustomSelect } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DatabaseInfo } from 'src/models/database';
import { useClipboardStore } from 'src/stores/clipboard';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useDrawerStore } from 'src/stores/drawer';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { useSearchStore } from 'src/stores/search';
import { isObject } from 'src/utils/helpers/general';
import { useGetDatabaseCurrent } from 'src/utils/hooks/useGetDatabaseCurrent';
import { useGetDatabases } from 'src/utils/hooks/useGetDatabases';
import { usePostDatabaseCurrent } from 'src/utils/hooks/usePostDatabaseCurrent';
import { DatabaseMenuSelectorProps } from './DatabaseMenuSelector.interfaces';

export const DatabaseMenuSelector = ({ id, className, testId }: DatabaseMenuSelectorProps) => {
	const [databases, setDatabases] = useState<Array<DatabaseInfo>>([]);
	const [selectedDatabase, setSelectedDatabase] = useState('');
	const previouslySelectedDatabaseRef = useRef('');
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const { t } = useTranslation();
	const rootElementClassName = clsx('database-menu__selector', className);
	const selectedDatabaseValue = [selectedDatabase];

	const { reFetch: reFetchDatabases, isLoading: isGetDatabasesLoading } = useGetDatabases({
		onSuccess: (response) => {
			setDatabases(response.data.databases);
		},
		executeImmediately: true
	});

	useGetDatabaseCurrent({
		onSuccess: (response) => {
			setSelectedDatabase(response.data.name);
		},
		executeImmediately: true
	});

	const { reFetch, isLoading: isPostDatabaseCurrentLoading } = usePostDatabaseCurrent({
		name: '',
		onSuccess: () => {
			// TODO check if other properties should be reset in search store,
			// and if a "reset" method like in stores below would be useful
			useSearchStore.getState().setResult([], '');
			useClipboardStore.getState().reset();
			useContextMenuStore.getState().reset();
			useDrawerStore.getState().reset();
			useGraphStore.getState().reset();
			useItemsStore.getState().reset();

			addNotification({
				title: t('notifications_success_user_database_change'),
				type: 'successful'
			});
		},
		onError: () => {
			setSelectedDatabase(previouslySelectedDatabaseRef.current);

			addNotification({
				title: t('notifications_failure_user_database_change'),
				type: 'critical'
			});
		}
	});

	const onDatabaseChange = (values: Array<string>) => {
		const newlySelectedDatabase = values[0];

		previouslySelectedDatabaseRef.current = selectedDatabase;

		reFetch({
			name: newlySelectedDatabase
		});

		setSelectedDatabase(newlySelectedDatabase);
	};

	// Typescript quickfix until https://github.com/db-ux-design-system/core-web/issues/4285 is fixed
	const fetchDatabases = (event: unknown) => {
		if (isObject(event) && 'newState' in event && event.newState === 'open') {
			reFetchDatabases();
		}
	};

	const options = databases.map((database) => {
		// \u{1F4A4}' is "💤" unicode
		const databaseStatusIndicator = database.status === 'online' ? '' : '\u{1F4A4}';

		return {
			value: database.name,
			label: `${database.name} ${databaseStatusIndicator}`,
			disabled: database.status !== 'online'
		};
	});

	return (
		<DBCustomSelect
			options={options}
			showLabel={false}
			id={id}
			className={rootElementClassName}
			label=""
			data-testid={testId}
			showIcon
			icon="databases"
			formFieldWidth="full"
			dropdownWidth="auto"
			showSearch
			placeholder={t('database_selector_placeholder')}
			showLoading={isPostDatabaseCurrentLoading || isGetDatabasesLoading}
			loadingText={t('database_selector_loading')}
			noResultsText={t('database_selector_nothing_found')}
			showClearSelection={false}
			onDropdownToggle={fetchDatabases}
			onOptionSelected={onDatabaseChange}
			searchPlaceholder={t('database_selector_search_placeholder')}
			values={selectedDatabaseValue}
		/>
	);
};
