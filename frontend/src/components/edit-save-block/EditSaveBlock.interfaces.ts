import { PropsWithChildren } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type EditSaveBlockProps = PropsWithChildren &
	GlobalComponentProps & {
		variant?: 'default' | 'small';
		isEditable?: boolean;
		isEditMode: boolean;
		headline: string;
		onEditClick: () => void;
		onSaveClick: () => void;
		onUndoClick: () => void;
	};
