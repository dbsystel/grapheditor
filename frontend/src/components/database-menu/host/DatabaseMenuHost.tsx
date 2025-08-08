import { DBIcon, DBSection, DBTooltip } from '@db-ux/react-core-components';
import { useLoginStore } from 'src/stores/login';
import clsx from 'clsx';
import { DatabaseMenuHostProps } from './DatabaseMenuHost.interfaces';
import './DatabaseMenuHost.scss';
import { useTranslation } from 'react-i18next';

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
