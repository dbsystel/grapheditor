import { GlobalComponentProps } from 'src/types/components';

export type GrassfileManagerStyleUploadProps = GlobalComponentProps & {
	onSuccess?: () => void;
	onClose?: () => void;
};

export type GrassfileManagerUploadDialogForm = {
	file: FileList | null;
};
