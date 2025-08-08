import { GlobalComponentProps } from 'src/types/components';

export type NetworkGraphPerspectiveSaveProps = GlobalComponentProps & {
	onSuccess?: () => void;
};
