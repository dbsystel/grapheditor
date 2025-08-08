import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Logout } from 'src/components/logout/Logout';
import { useLoginStore } from 'src/stores/login';
import { LoginDisplayProps } from './LoginDisplay.interfaces';

export const LoginDisplay = ({ id, className, testId }: LoginDisplayProps) => {
	const { t } = useTranslation();
	const { isConnected, username, host } = useLoginStore((state) => state);
	const [connectedMsg, setConnectedMsg] = useState<string>('');
	const rootElementClassName = clsx('login-display', className);

	useEffect(() => {
		if (isConnected) {
			setConnectedMsg(t('form_login_established', { username: username, host: host }));
		} else {
			setConnectedMsg('');
		}
	}, [isConnected, username, host]);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<p>{connectedMsg}</p>
			<Logout withLabel={true} />
		</div>
	);
};
