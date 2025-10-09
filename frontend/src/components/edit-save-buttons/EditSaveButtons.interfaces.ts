import { GlobalComponentProps } from 'src/types/components';

export type EditSaveButtonProps = GlobalComponentProps & {
	headline: string;
	isEditMode: boolean;
	onEditClick: () => void;
	onSaveClick: () => void;
	onUndoClick: () => void;
};
