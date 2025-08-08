import './Auth.scss';
import clsx from 'clsx';
import { useEffect } from 'react';
import { Loading } from 'src/components/loading/Loading';
import { LoginForm } from 'src/components/login-form/LoginForm';
import { useLoginStore } from 'src/stores/login';
import { AuthProps } from './Auth.interfaces';

export const Auth = ({ children, id, className, testId }: AuthProps) => {
	const { init, isConnected, isConnecting } = useLoginStore((store) => store);
	const rootElementClassName = clsx('auth', className);

	useEffect(() => {
		init();
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
