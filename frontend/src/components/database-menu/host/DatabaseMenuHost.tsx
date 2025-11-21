import './DatabaseMenuHost.scss';
import { DBIcon, DBSection, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLoginStore } from 'src/stores/login';
import { DatabaseMenuHostProps } from './DatabaseMenuHost.interfaces';

export const DatabaseMenuHost = ({ id, className, testId }: DatabaseMenuHostProps) => {
	const { host } = useLoginStore((state) => state);
	const rootElementClassName = clsx('database-menu__host', className);
	const { t } = useTranslation();

	return (
		<DBSection className={rootElementClassName} id={id} data-testid={testId} spacing="none">
			<DBIcon icon="globe" />
			<p>
				{host} <DBTooltip>{t('database_menu_host')}</DBTooltip>
			</p>
		</DBSection>
	);
};
