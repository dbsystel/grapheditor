import { GlobalComponentProps } from 'src/types/components';

export type LoginFormProps = GlobalComponentProps;

export type LoginFormData = {
	host: string;
	username: string;
	password: string;
};
