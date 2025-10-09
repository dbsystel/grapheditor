import { GlobalComponentProps } from 'src/types/components';

export type UnsavedChangedModalProps = GlobalComponentProps & {
	unsavedSectionName: string;
	onCancelClick: () => void;
	onSaveClick: () => void;
};
