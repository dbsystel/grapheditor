import { NodeId } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

export type LoadPerspectiveProps = GlobalComponentProps & {
	perspectiveId: NodeId;
};
