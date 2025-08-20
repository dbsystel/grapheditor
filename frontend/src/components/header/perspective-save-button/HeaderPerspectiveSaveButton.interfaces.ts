import { GlobalComponentProps } from 'src/types/components';

export type HeaderPerspectiveSaveButtonProps = GlobalComponentProps & {
	perspectiveId: string;
	onSuccess?: () => void;
	closeMenuFunction: () => void;
};
