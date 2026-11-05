import './Logout.scss';
import { DBButton, DBCheckbox, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from 'src/utils/api/api';
import { logOutUserLocally } from 'src/utils/helpers/auth';
import { LogoutProps } from './Logout.interfaces';

export const Logout = ({ id, className, testId }: LogoutProps) => {
	const { t } = useTranslation();
	const doSSOServerLogoutRef = useRef(false);
	const rootElementClassName = clsx('logout', className);

	const onDisconnect = () => {
		api.users.fetch.postLogout({ ssoLogout: doSSOServerLogoutRef.current }).then(() => {
			logOutUserLocally();
		});
	};

	const onSSOServerLogoutChange = (event: ChangeEvent<HTMLInputElement>) => {
		doSSOServerLogoutRef.current = event.target.checked;
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<DBButton type="button" icon="log_out" variant="filled" onClick={onDisconnect}>
				{t('logout_logout_button')}
			</DBButton>

			<div className={rootElementClassName + '__sso-logout-checkbox-container'}>
				<DBCheckbox label="SSO Logout" size="small" onChange={onSSOServerLogoutChange} />
				<DBTooltip className="db-tooltip-fix db-tooltip-fix--top-end">
					{t('logout_sso_logout_tooltip')}
				</DBTooltip>
			</div>
		</div>
	);
};
