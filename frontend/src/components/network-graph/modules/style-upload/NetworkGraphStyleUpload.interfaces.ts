import { GlobalComponentProps } from 'src/types/components';

export type NetworkGraphStyleUploadProps = GlobalComponentProps & {
	onSuccess?: () => void;
};
