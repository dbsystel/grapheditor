import './LoginForm.scss';
import { DBButton, DBInput, DBSelect } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form } from 'src/components/form/Form';
import { FormRow } from 'src/components/form-row/FormRow';
import { Loading } from 'src/components/loading/Loading';
import { Logo } from 'src/components/logo/Logo';
import { useNotificationsStore } from 'src/stores/notifications';
import { api } from 'src/utils/api/api';
import { SSO_HOST_STORAGE_KEY } from 'src/utils/constants';
import { logInUserLocally } from 'src/utils/helpers/auth';
import { parseError } from 'src/utils/helpers/general';
import {
	LoginFormData,
	LoginFormProps,
	LoginFormType,
	LoginFormTypeOption
} from './LoginForm.interfaces';

export const LoginForm = ({ id, className, testId }: LoginFormProps) => {
	const { t } = useTranslation();
	const [authenticationType, setAuthenticationType] =
		useState<LoginFormType>('username-password');
	const [isLoading, setIsLoading] = useState(
		Boolean(window.localStorage.getItem(SSO_HOST_STORAGE_KEY))
	);
	const { register, handleSubmit } = useForm<LoginFormData>();
	const rootElementClassName = clsx('login-form', className);

	const onLoginTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const selectedType = event.target.value;

		if (selectedType === 'username-password' || selectedType === 'sso') {
			setAuthenticationType(selectedType);
		}
	};

	const onSubmit: SubmitHandler<LoginFormData> = ({ host, username, password }) => {
		if (authenticationType === 'username-password') {
			setIsLoading(true);

			api.users.fetch
				.postLogin({
					host: host,
					username: username,
					password: password
				})
				.then((response) => {
					const { host, username, tabId } = response.data;

					logInUserLocally({ host: host, username: username, tabId: tabId });
				})
				.catch((error) => {
					setIsLoading(false);

					useNotificationsStore.getState().addNotification({
						title: parseError(error),
						type: 'critical'
					});
				});
		} else if (authenticationType === 'sso') {
			setIsLoading(true);

			// The backend keeps track of two independent things: a single sign on
			// authentication token for this browser session, shared by all tabs, and a
			// separate connection for this specific tab. Because of that, this call
			// can resolve in two different ways below, regardless of whether this is
			// the first single sign on attempt or not.
			api.users.fetch
				.postLoginSSO({
					host: host,
					useToken: true
				})
				.then(async (response) => {
					if ('authorizationUrl' in response.data) {
						// There is no valid authentication token yet for this browser session
						// (for example, the user never logged in with single sign on before, the
						// token expired, or a previous regular logout still left this tab without
						// a token - see the "else" branch below for when a token is still valid).
						// The user therefore needs to be sent to the identity provider to
						// authenticate, so we persist the host in localStorage first:
						// "window.location.assign" below navigates away from the application
						// entirely, and once the identity provider redirects back, the backend
						// completes the authentication and sends the browser back to the
						// application, which reloads from scratch. The "Auth" component then picks
						// up this stored host on mount to resume and complete the single sign on
						// login.
						await new Promise((resolve) => {
							window.localStorage.setItem(SSO_HOST_STORAGE_KEY, host);
							resolve('ok');
						});

						window.location.assign(response.data.authorizationUrl);
					} else {
						// A valid authentication token already exists for this browser session,
						// so the backend logged us in immediately without needing to send the user
						// to the identity provider. This happens for example when opening a new
						// tab, or after a regular logout, which only clears this tab's connection,
						// not the underlying authentication token - a full single sign on logout is
						// needed to invalidate the token itself.
						const { host, username, tabId } = response.data;

						logInUserLocally({ host: host, username: username, tabId: tabId });
					}
				})
				.catch((error) => {
					setIsLoading(false);

					useNotificationsStore.getState().addNotification({
						title: parseError(error),
						type: 'critical'
					});
				});
		}
	};

	const loginOptions: Array<LoginFormTypeOption> = [
		{ label: 'Username / Password', value: 'username-password' },
		{
			label: 'Single Sign On',
			value: 'sso'
		}
	];

	return (
		<Loading isLoading={isLoading} renderChildrenWhileLoading={true}>
			<div id={id} className={rootElementClassName} data-testid={testId}>
				<div className="login-form__content">
					<Logo className="login-form__logo" />
					<Form
						onSubmit={handleSubmit(onSubmit)}
						disableImplicitSubmission={false}
						className="login-form__form"
					>
						<FormRow>
							<DBInput
								{...register('host')}
								label={t('form_login_host')}
								type="url"
								validMessage=""
								invalidMessage=""
							></DBInput>
						</FormRow>
						<FormRow>
							<DBSelect
								label={t('login_form_authentication_type_label')}
								value={authenticationType}
								options={loginOptions}
								onChange={onLoginTypeChange}
							/>
						</FormRow>
						{authenticationType === 'username-password' && (
							<>
								<FormRow>
									<DBInput
										{...register('username')}
										label={t('form_login_username')}
										validMessage=""
										invalidMessage=""
									></DBInput>
								</FormRow>
								<FormRow>
									<DBInput
										{...register('password')}
										label={t('form_login_password')}
										placeholder=""
										type="password"
										validMessage=""
										invalidMessage=""
									></DBInput>
								</FormRow>
							</>
						)}
						<DBButton type="submit" icon="log_in" variant="Brand">
							Connect
						</DBButton>
					</Form>
				</div>
			</div>
		</Loading>
	);
};
