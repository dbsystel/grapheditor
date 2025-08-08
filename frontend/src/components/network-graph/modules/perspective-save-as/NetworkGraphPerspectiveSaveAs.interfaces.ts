import { GlobalComponentProps } from 'src/types/components';

export type NetworkGraphPerspectiveSaveAsProps = GlobalComponentProps & {
	onSuccess?: () => void;
};
