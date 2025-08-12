import { GraphEditorTypeSimplified } from 'src/utils/constants';
import { idFormatter } from 'src/utils/idFormatter';

export const labelIds: Array<string> = [
	idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_LABEL, 'label-0', 'tech'),
	idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_LABEL, 'label-1', 'tech'),
	idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_LABEL, 'label-2', 'tech'),
	idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_LABEL, 'label-3', 'tech'),
	idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_LABEL, 'label-4', 'tech')
];
