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
import { setApiHeaderTabId } from 'src/utils/api';
import { usersApi } from 'src/utils/api/users';
import { resetApplicationStates } from 'src/utils/helpers/general';
import { AuthProps } from './Auth.interfaces';

export const Auth = ({ children, id, className, testId }: AuthProps) => {
	const { isConnected, isConnecting, setIsConnecting, tabId, connect, disconnect } =
		useLoginStore((store) => store);
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
		setApiHeaderTabId(tabId);
		setIsConnecting(true);

		usersApi
			.getLogin()
			.then((data) => {
				connect(data.data.host, data.data.username);
			})
			.catch(() => {
				disconnect();
			});
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

	if (isConnected) {
		return children;
	}

	return <LoginForm id={id} className={rootElementClassName} testId={testId} />;
};
