import { GlobalComponentProps } from 'src/types/components';

export type CreatePerspectiveDialogProps = GlobalComponentProps & {
	closeFunction: () => void;
	onSuccess?: () => void;
	isEditMode?: boolean;
};

export type CreatePerspectiveDialogForm = {
	name: string;
	description?: string;
};
