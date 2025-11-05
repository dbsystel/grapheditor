import './LoginForm.scss';
import { DBButton, DBInput } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form } from 'src/components/form/Form';
import { FormRow } from 'src/components/form-row/FormRow';
import { initializeApplicationStoresObservers } from 'src/observers';
import { useLoginStore } from 'src/stores/login';
import { useNotificationsStore } from 'src/stores/notifications';
import { usersApi } from 'src/utils/api/users';
import { LoginFormData, LoginFormProps } from './LoginForm.interfaces';

export const LoginForm = ({ id, className, testId }: LoginFormProps) => {
	const { t } = useTranslation();
	const connect = useLoginStore((state) => state.connect);
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const { register, handleSubmit } = useForm<LoginFormData>();
	const rootElementClassName = clsx('login-form', className);

	const onSubmit: SubmitHandler<LoginFormData> = ({ host, username, password }) => {
		usersApi
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
			});
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
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
				<DBButton type="submit" icon="log_in" variant="Brand">
					Connect
				</DBButton>
			</Form>
		</div>
	);
};
