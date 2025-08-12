import { GraphEditorTypeSimplified } from 'src/utils/constants';
import { idFormatter } from 'src/utils/idFormatter';

export const typeIds: Array<string> = [
	idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_RELATION, 'type-1'),
	idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_RELATION, 'type-2'),
	idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_RELATION, 'type-3'),
	idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_RELATION, 'type-4'),
	idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_RELATION, 'type-5')
];
