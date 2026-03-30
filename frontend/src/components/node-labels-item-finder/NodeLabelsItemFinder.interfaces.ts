import { LabelVariantType } from '@db-ux/react-core-components/dist/shared/model';
import { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';
import { ItemFinderProps } from 'src/components/item-finder/ItemFinder.interfaces';
import { Node, NodeId } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

export type NodeLabelsItemFinderProps = GlobalComponentProps & {
	title?: ReactNode;
	value?: Array<Node>;
	labels?: Array<Node>;
	invalidMessage?: string;
	showTooltipOnHover?: boolean;
	// needed to create labels "on-the-fly"
	namespace?: string;
	onChange?: ItemFinderProps<Node>['onChange'];
	label?: string;
	variant?: LabelVariantType;
	placeholder?: string;
	defaultSelectedOptions?: ItemFinderProps<Node>['defaultSelectedOptions'];
	onTagsSelected?: (updatedTagLabelObjects: Array<Node>) => void;
	markTagIdsAsWarning?: Array<NodeId>;
	isEditMode?: boolean;
	handleRef?: RefObject<NodeLabelsItemFinderHandle>;
	isSelectAllDisabled?: boolean;
} & (DefaultMode | EditMode);

type DefaultMode = {
	mode: 'default';
};

type EditMode = {
	mode: 'edit';
	node: Node;
};

export type NodeLabelsItemFinderTagProps = {
	isNewlyAdded: boolean;
	isSelected: boolean;
	isHighlighted: boolean;
	showTooltipOnHover?: boolean;
	shouldRenderWarningIcon?: boolean;
	editLabels: boolean;
	label: Node;
	onLabelChange: (item: Node, isItemSelected: boolean, selectedItems: Array<Node>) => void;
	value: Array<Node>;
	onTagSelect: (tagId: NodeId) => void;
	tooltipLabel: Node | null;
};

export type NodeLabelsItemFinderHandle = {
	handleSave: () => Promise<void>;
	handleUndo: () => void;
	setHighlightedTagIds: Dispatch<SetStateAction<Array<NodeId>>>;
	labels: Array<NodeId>;
} | null;
