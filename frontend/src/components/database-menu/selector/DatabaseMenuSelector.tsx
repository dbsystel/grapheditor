import './DatabaseMenuSelector.scss';
import { DBCustomSelect } from '@db-ux/react-core-components';
import { GeneralEvent } from '@db-ux/react-core-components/dist/shared/model';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DatabaseInfo } from 'src/models/database';
import { useNotificationsStore } from 'src/stores/notifications';
import { resetApplicationStates } from 'src/utils/helpers/general';
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
			resetApplicationStates();

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
