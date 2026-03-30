import './Auth.scss';
import clsx from 'clsx';
import { useEffect, useMemo } from 'react';
import { Loading } from 'src/components/loading/Loading';
import { LoginForm } from 'src/components/login-form/LoginForm';
import {
	destroyApplicationStoresObservers,
	initializeApplicationStoresObservers
} from 'src/observers';
import { useLoginStore } from 'src/stores/login';
import { useNotificationsStore } from 'src/stores/notifications';
import { api } from 'src/utils/api/api';
import { setBackendApiHeaderTabId } from 'src/utils/backend-api';
import { SSO_HOST_STORAGE_KEY } from 'src/utils/constants';
import { parseError, resetApplicationStates } from 'src/utils/helpers/general';
import { AuthProps } from './Auth.interfaces';

export const Auth = ({ children, id, className, testId }: AuthProps) => {
	const {
		isConnected,
		isConnecting,
		setIsConnecting,
		tabId,
		connect,
		disconnect,
		checkIfLoggedInDone,
		setCheckIfLoggedInDone
	} = useLoginStore((store) => store);
	const rootElementClassName = clsx('auth', className);

	// TODO this is a quick-fix, not a proper solution. This logic shouldn't be part of the Auth component
	//  --quick-fix start
	useMemo(() => {
		if (isConnected) {
			initializeApplicationStoresObservers();
		} else {
			destroyApplicationStoresObservers();
		}
	}, [isConnected]);

	// reset application state after other components are done with rendering/unmount
	useEffect(() => {
		if (!isConnected) {
			resetApplicationStates();
		}
	}, [isConnected]);
	// TODO --quick-fix end

	useEffect(() => {
		setBackendApiHeaderTabId(tabId);
		setIsConnecting(true);

		const checkLogin = async () => {
			const ssoHost = await new Promise((resolve: (value: string | null) => void) => {
				resolve(window.localStorage.getItem(SSO_HOST_STORAGE_KEY));
			});

			let loginPromise;

			// try and continue SSO login if SSO login in progress
			if (ssoHost) {
				await new Promise((resolve) => {
					window.localStorage.removeItem(SSO_HOST_STORAGE_KEY);
					resolve('ok');
				});

				loginPromise = api.users.fetch
					.postLoginSSO({
						host: ssoHost,
						useToken: true
					})
					.then((response) => {
						if ('host' in response.data && 'username' in response.data) {
							connect(response.data.host, response.data.username);
						}
					})
					.catch((error) => {
						useNotificationsStore.getState().addNotification({
							title: parseError(error),
							type: 'critical'
						});
					});
			}
			// else try and get existing login session
			else {
				loginPromise = api.users.fetch.getLogin().then((data) => {
					connect(data.data.host, data.data.username);
				});
			}

			loginPromise
				.catch(() => {
					disconnect();
				})
				.finally(() => {
					setCheckIfLoggedInDone(true);
				});
		};

		checkLogin();
	}, []);

	if (isConnecting) {
		return (
			<div className="auth__loading-container">
				<Loading isLoading={true} renderChildrenWhileLoading={true}>
					Connecting...
				</Loading>
			</div>
		);
	}

	if (checkIfLoggedInDone) {
		if (isConnected) {
			return children;
		} else {
			return <LoginForm id={id} className={rootElementClassName} testId={testId} />;
		}
	}

	return null;
};
