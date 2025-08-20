import { GlobalComponentProps } from 'src/types/components';

export type HeaderPerspectiveDeleteButtonProps = GlobalComponentProps & {
	perspectiveId: string;
	closeMenuFunction: () => void;
};
