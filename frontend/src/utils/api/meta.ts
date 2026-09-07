import { getRelationEndSuggestions } from 'src/utils/fetch/getRelationEndSuggestions';
import { getRelationTypeSuggestions } from 'src/utils/fetch/getRelationTypeSuggestions';
import { postMetaForMeta } from 'src/utils/fetch/postMetaForMeta';

export const metaApi = {
	fetch: {
		postMetaForMeta: postMetaForMeta,
		getRelationTypeSuggestions: getRelationTypeSuggestions,
		getRelationEndSuggestions: getRelationEndSuggestions
	}
};
