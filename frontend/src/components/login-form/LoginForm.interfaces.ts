import { GlobalComponentProps } from 'src/types/components';

export type LoginFormProps = GlobalComponentProps;

export type LoginFormData = {
	host: string;
	username: string;
	password: string;
};

export type LoginFormType = 'username-password' | 'sso';
export type LoginFormTypeOption = {
	[K in LoginFormType]: {
		label: K extends 'username-password' ? 'Username / Password' : 'Single Sign On';
		value: K;
	};
}[LoginFormType];
