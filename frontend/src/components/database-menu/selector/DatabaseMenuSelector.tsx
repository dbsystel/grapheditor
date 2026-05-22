import './DatabaseMenuSelector.scss';
import { DBCustomSelect } from '@db-ux/react-core-components';
import { GeneralEvent } from '@db-ux/react-core-components/dist/shared/model';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Database } from 'src/models/database';
import { useDatabaseStore } from 'src/stores/database';
import { useNotificationsStore } from 'src/stores/notifications';
import { resetApplicationStates } from 'src/utils/helpers/general';
import { useGetDatabaseCurrent } from 'src/utils/hooks/useGetDatabaseCurrent';
import { useGetDatabases } from 'src/utils/hooks/useGetDatabases';
import { usePostDatabaseCurrent } from 'src/utils/hooks/usePostDatabaseCurrent';
import { DatabaseMenuSelectorProps } from './DatabaseMenuSelector.interfaces';

export const DatabaseMenuSelector = ({ id, className, testId }: DatabaseMenuSelectorProps) => {
	const [databases, setDatabases] = useState<Array<Database>>([]);
	const [selectedDatabase, setSelectedDatabase] = useState('');
	const previouslySelectedDatabaseRef = useRef('');
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const { t } = useTranslation();
	const rootElementClassName = clsx('database-menu__selector', className);
	const selectedDatabaseValue = [selectedDatabase];
	const selectedDatabaseRef = useRef(selectedDatabase);

	const { reFetch: reFetchDatabases, isLoading: isGetDatabasesLoading } = useGetDatabases({
		onSuccess: (response) => {
			setDatabases(response.data.databases);
		},
		executeImmediately: true
	});

	useGetDatabaseCurrent({
		onSuccess: (response) => {
			useDatabaseStore.getState().setCurrentDatabase(response.data);
			setSelectedDatabase(response.data.name);
		},
		onFinally() {
			useDatabaseStore.getState().setIsLoading(false);
		},
		executeImmediately: true
	});

	const { reFetch, isLoading: isPostDatabaseCurrentLoading } = usePostDatabaseCurrent({
		name: '',
		onSuccess: (response) => {
			resetApplicationStates();
			useDatabaseStore.getState().setCurrentDatabase(response.data);

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
		},
		onFinally() {
			useDatabaseStore.getState().setIsLoading(false);
		}
	});

	useEffect(() => {
		useDatabaseStore.getState().setIsLoading(true);
	}, []);

	const onDatabaseChange = (values: Array<string>) => {
		const newlySelectedDatabase = values[0];
		useDatabaseStore.getState().setIsLoading(true);

		previouslySelectedDatabaseRef.current = selectedDatabase;
		selectedDatabaseRef.current = newlySelectedDatabase;

		reFetch({
			name: newlySelectedDatabase
		});

		setSelectedDatabase(newlySelectedDatabase);
	};

	const fetchDatabases = (event: GeneralEvent<HTMLDetailsElement>) => {
		if ('newState' in event && event.newState === 'open') {
			reFetchDatabases();
		}
	};

	const options = databases.map((database) => {
		// \u{1F4A4}' is "💤" unicode
		const databaseStatusIndicator = database.status === 'online' ? '' : '\u{1F4A4}';

		return {
			value: database.name,
			label: `${database.name} ${databaseStatusIndicator}`,
			disabled: database.status !== 'online' || database.type === 'composite'
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
