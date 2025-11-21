import './DatabaseMenuLoginInfo.scss';
import { DBIcon, DBSection, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLoginStore } from 'src/stores/login';
import { DatabaseMenuLoginInfoProps } from './DatabaseMenuLoginInfo.interfaces';

export const DatabaseMenuLoginInfo = ({ id, className, testId }: DatabaseMenuLoginInfoProps) => {
	const { username } = useLoginStore((state) => state);
	const rootElementClassName = clsx('database-menu__login-info', className);
	const { t } = useTranslation();

	return (
		<DBSection id={id} className={rootElementClassName} data-testid={testId} spacing="none">
			<DBIcon icon="person" />
			<p>
				{username} <DBTooltip>{t('database_menu_user')}</DBTooltip>
			</p>
		</DBSection>
	);
};
