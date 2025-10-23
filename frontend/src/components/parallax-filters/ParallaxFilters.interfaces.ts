import { NodeLabelId } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

export type ParallaxFiltersProps = GlobalComponentProps;

export type ParallaxFiltersLabelsDropdown = {
	options: Array<{ label: string; value: NodeLabelId }>;
	values: Array<NodeLabelId>;
};
