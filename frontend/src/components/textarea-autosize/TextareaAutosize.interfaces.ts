import { DBTextareaProps } from '@db-ux/react-core-components/dist/components/textarea/model';
import { AllHTMLAttributes, ChangeEvent } from 'react';
import { GlobalComponentProps } from 'src/types/components';

// not sure why, but DBTextareaProps wasn't enough
// TODO check the status of https://github.com/db-ui/mono/issues/2497, migrate
// to the DB component if resolved
export type TextareaAutosizeProps = GlobalComponentProps &
	Omit<DBTextareaProps & AllHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & {
		onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
	};
