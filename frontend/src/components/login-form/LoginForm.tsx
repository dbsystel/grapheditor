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
import { useLoginStore } from 'src/stores/login';
import { useNotificationsStore } from 'src/stores/notifications';
import { api } from 'src/utils/api/api';
import { SSO_HOST_STORAGE_KEY } from 'src/utils/constants';
import { parseError } from 'src/utils/helpers/general';
import { LoginFormData, LoginFormProps } from './LoginForm.interfaces';

export const LoginForm = ({ id, className, testId }: LoginFormProps) => {
	const { t } = useTranslation();
	const connect = useLoginStore((state) => state.connect);
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const [authenticationType, setAuthenticationType] = useState<'username-password' | 'sso'>(
		'username-password'
	);
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
			api.users.fetch
				.postLogin({
					host: host,
					username: username,
					password: password
				})
				.then(() => {
					connect(host, username);

					addNotification({
						title: t('notifications_success_login'),
						type: 'successful'
					});
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

			api.users.fetch
				.postLoginSSO({
					host: host,
					useToken: true
				})
				.then(async (response) => {
					if ('authorizationUrl' in response.data) {
						await new Promise((resolve) => {
							window.localStorage.setItem(SSO_HOST_STORAGE_KEY, host);
							resolve('ok');
						});

						window.location.assign(response.data.authorizationUrl);
					} else {
						connect(response.data.host, response.data.username);
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

	const loginOptions = [
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
